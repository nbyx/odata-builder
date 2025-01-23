import { CombinedFilter } from 'src/query-builder/types/filter/combined-filter.type';
import {
    ArrayElement,
    ArrayFields,
    DateTransform,
    QueryFilter,
    StringFilterOperators,
} from 'src/query-builder/types/filter/query-filter.type';
import { isCombinedFilter } from './combined-filter-util';
import { isBasicFilter } from './filter-utils';
import { getValueType, isValidOperator } from './filter-helper.util';

interface FilterVisitor<T> {
    visitBasicFilter(filter: QueryFilter<T>): string;
    visitLambdaFilter(filter: QueryFilter<T>, prefix?: string): string;
    visitCombinedFilter(filter: CombinedFilter<T>, prefix?: string): string;
}

export class ODataFilterVisitor<T> implements FilterVisitor<T> {
    visitBasicFilter<U>(filter: QueryFilter<U>): string {
        if (!('value' in filter)) {
            throw new Error('Invalid BasicFilter: missing "value" property');
        }

        if (filter.value === null) {
            return `${filter.field} ${filter.operator} null`;
        }

        const valueType = getValueType(filter.value);

        if (valueType === 'unknown') {
            throw new Error(`Unsupported value type: ${typeof filter.value}`);
        }

        this.validateOperator(valueType, filter.operator);

        const transformedField = this.getTransformedField(filter);

        if (filter.value instanceof Date) {
            if ('transform' in filter && filter.transform.length) {
                const transformedValue = this.applyDateTransforms(
                    filter.value,
                    filter.transform as DateTransform[],
                );
                return `${transformedField} ${filter.operator} ${transformedValue}`;
            } else {
                // Konvertiere Datum in ISO-String
                const isoDate = filter.value.toISOString();
                return `${transformedField} ${filter.operator} ${isoDate}`;
            }
        }

        if (typeof filter.value === 'string') {
            const transformedValue =
                'ignoreCase' in filter && filter.ignoreCase
                    ? filter.value.toLowerCase()
                    : filter.value;

            const value = filter.removeQuotes
                ? transformedValue
                : `'${transformedValue}'`;

            if (this.isStringFilterFunction(filter.operator)) {
                return `${filter.operator}(${transformedField}, ${value})`;
            }

            return `${transformedField} ${filter.operator} ${value}`;
        }

        if (typeof filter.value === 'number') {
            return `${transformedField} ${filter.operator} ${filter.value}`;
        }

        return `${transformedField} ${filter.operator} ${String(filter.value)}`;
    }

    visitLambdaFilter<U>(
        filter: QueryFilter<U>,
        parentPrefix?: string,
    ): string {
        if (
            !('lambdaOperator' in filter) ||
            !filter.lambdaOperator ||
            !('expression' in filter) ||
            !filter.expression
        ) {
            throw new Error(`Invalid LambdaFilter: ${JSON.stringify(filter)}`);
        }

        // Generate new parameter name based on parent
        const currentParam = parentPrefix
            ? String.fromCharCode(parentPrefix.charCodeAt(0) + 1)
            : 's'; // Start with 's' if no parent

        const expression = filter.expression;
        const field = this.getPrefixedField(filter.field, parentPrefix);

        if (isCombinedFilter(expression)) {
            const subQuery = this.visitCombinedFilter(expression, currentParam);
            return `${field}/${filter.lambdaOperator}(${currentParam}: ${subQuery})`;
        }

        if (
            isLambdaFilter(
                expression as QueryFilter<ArrayElement<U, ArrayFields<U>>>,
            )
        ) {
            const nestedQuery = this.visitLambdaFilter(
                expression as QueryFilter<ArrayElement<U, ArrayFields<U>>>,
                currentParam,
            );
            return `${field}/${filter.lambdaOperator}(${currentParam}: ${nestedQuery})`;
        }

        if (isBasicFilter(expression)) {
            const prefixedExpression = {
                ...expression,
                field: this.getPrefixedField(
                    expression.field || '',
                    currentParam,
                ),
                ignoreCase:
                    'ignoreCase' in expression
                        ? expression.ignoreCase
                        : undefined,
                removeQuotes:
                    'removeQuotes' in expression
                        ? expression.removeQuotes
                        : undefined,
                transform:
                    'transform' in expression
                        ? expression.transform
                        : undefined,
            } as QueryFilter<U>;
            const subQuery = this.visitBasicFilter(prefixedExpression);
            return `${field}/${filter.lambdaOperator}(${currentParam}: ${subQuery})`;
        }

        throw new Error(
            `Invalid expression in LambdaFilter: ${JSON.stringify(expression)}`,
        );
    }

    visitCombinedFilter<U>(
        filter: CombinedFilter<U>,
        currentPrefix?: string,
    ): string {
        const combinedQueries = filter.filters
            .map(subFilter => {
                if (isCombinedFilter(subFilter)) {
                    return this.visitCombinedFilter(subFilter, currentPrefix);
                }
                if (isLambdaFilter(subFilter as QueryFilter<U>)) {
                    return this.visitLambdaFilter(
                        subFilter as QueryFilter<U>,
                        currentPrefix,
                    );
                }
                if (isBasicFilter(subFilter)) {
                    const prefixedFilter = {
                        ...subFilter,
                        field: this.getPrefixedField(
                            subFilter.field,
                            currentPrefix,
                        ),
                    } as QueryFilter<U>;
                    return this.visitBasicFilter(prefixedFilter);
                }
                throw new Error(
                    `Invalid sub-filter: ${JSON.stringify(subFilter)}`,
                );
            })
            .join(` ${filter.logic} `);

        return combinedQueries.includes(' ')
            ? `(${combinedQueries})`
            : combinedQueries;
    }

    private getTransformedField<U>(filter: QueryFilter<U>): string {
        // Alle definierten Transformationen zusammenfassen
        const transforms = [
            ...('ignoreCase' in filter && filter.ignoreCase ? ['tolower'] : []),
            ...('transform' in filter && Array.isArray(filter.transform)
                ? filter.transform
                : []),
        ];

        // Transformationen auf das Feld anwenden
        return transforms.reduce(
            (acc, transform) => `${transform}(${acc})`,
            `${String(filter.field)}`,
        );
    }

    private applyDateTransforms(
        date: Date,
        transforms: DateTransform[],
    ): number {
        const dateTransforms: Record<DateTransform, (date: Date) => number> = {
            year: date => date.getUTCFullYear(),
            month: date => date.getUTCMonth() + 1,
            day: date => date.getUTCDate(),
            hour: date => date.getUTCHours(),
            minute: date => date.getUTCMinutes(),
            second: date => date.getUTCSeconds(),
        };

        return transforms.reduce((acc, transform) => {
            const transformFn = dateTransforms[transform];
            if (!transformFn) {
                throw new Error(`Unsupported DateTransform: ${transform}`);
            }
            return transformFn(new Date(acc)); // Transformierten Wert erneut anwenden
        }, +date); // Datum in Timestamp umwandeln
    }

    private getPrefixedField(
        field: string | number | symbol,
        prefix?: string,
    ): string {
        const fieldStr = String(field);
        if (!prefix) return fieldStr;
        return fieldStr ? `${prefix}/${fieldStr}` : prefix;
    }

    private isStringFilterFunction(x: unknown): x is StringFilterOperators {
        return (
            typeof x === 'string' &&
            (x === 'contains' ||
                x === 'startswith' ||
                x === 'endswith' ||
                x === 'startswith' ||
                x === 'endswith' ||
                x === 'substringof' ||
                x === 'indexof' ||
                x === 'concat')
        );
    }

    private validateOperator(type: string, operator: string): void {
        if (!isValidOperator(type, operator)) {
            throw new Error(
                `Invalid operator "${operator}" for type "${type}"`,
            );
        }
    }
}

// Helper type guard for lambda filters
function isLambdaFilter<T>(filter: QueryFilter<T>): filter is QueryFilter<T> & {
    lambdaOperator: string;
    expression: unknown;
} {
    return (
        'lambdaOperator' in filter &&
        typeof filter.lambdaOperator === 'string' &&
        'expression' in filter
    );
}

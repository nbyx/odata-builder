import { CombinedFilter } from '../../types/filter/combined-filter.type';
import { isCombinedFilter as isGloballyCombinedFilter } from './combined-filter-util';
import { isBasicFilter as isTrulyBasicFilter } from './filter-utils';
import { getValueType, isValidOperator } from './filter-helper.util';
import {
AnySupportedFunction,
ArithmeticFunctionDefinition,
DateFunctionDefinition,
DateTransform,
FieldReference,
FilterFields,
FilterOperators,
LambdaFilter,
QueryFilter,
StandardFilter,
ArithmeticOperator,
StringFilterOperators,
DirectBooleanODataFunctionFilter,
} from '../../types/filter/query-filter.type';

type BaseFilterVariant<T> = Exclude<QueryFilter<T>, LambdaFilter<T>>;
// Hilfstyp für den Cast innerhalb von visitBasicFilter, wenn eine Funktion vorhanden ist
type FilterWithFunction = Extract<BaseFilterVariant<any>, { function: AnySupportedFunction<any> }>;

interface FilterVisitor<T> {
visitBasicFilter(filter: QueryFilter<T>): string;
visitLambdaFilter(filter: LambdaFilter<T>, prefix?: string): string;
visitCombinedFilter(filter: CombinedFilter<T>, prefix?: string): string;
}

export class ODataFilterVisitor<T> implements FilterVisitor<T> {
public visitBasicFilter<U>(filter: QueryFilter<U>): string {
if (!isTrulyBasicFilter(filter)) {
throw new Error(
'visitBasicFilter called with a non-basic filter type. This indicates a dispatching logic error.',
);
}
const basicFilter = filter as BaseFilterVariant<U>;
const fieldPath = String(basicFilter.field);

      
if (basicFilter.function) {
        // basicFilter ist hier eine der Varianten von *QueryFilter<U>, die eine 'function' Eigenschaft hat.
        // Dies sind die ComparisonFunctionFilter oder DirectBooleanODataFunctionFilter Teile.
        const currentFunction = basicFilter.function;
        if (
            !currentFunction ||
            typeof currentFunction.type !== 'string' ||
            !currentFunction.type.trim()
        ) {
            throw new Error(
                `Invalid function definition on field "${fieldPath}": "type" property is missing, not a string, or empty.`,
            );
        }

        const fieldForFunction = this.getTransformedFieldForFunction(basicFilter);

        const functionCallString = this.processFunction(
            currentFunction,
            fieldForFunction,
        );

        const isDirectBooleanODataFunction =
            currentFunction.type === 'contains' ||
            currentFunction.type === 'startswith' ||
            currentFunction.type === 'endswith';

        if (isDirectBooleanODataFunction) {
            // basicFilter ist hier DirectBooleanODataFunctionFilter
            const directBoolFilter = basicFilter as DirectBooleanODataFunctionFilter<U, Extract<keyof U, string>>;
            if (
                directBoolFilter.operator !== undefined &&
                directBoolFilter.value !== undefined && // value can be true, false, or null (if operator allows)
                (directBoolFilter.operator === 'eq' || directBoolFilter.operator === 'ne') &&
                (typeof directBoolFilter.value === 'boolean' || directBoolFilter.value === null)
            ) {
                return `${functionCallString} ${directBoolFilter.operator} ${this.formatValue(directBoolFilter.value)}`;
            }
            return functionCallString; // Impliziert 'eq true'
        } else {
            // basicFilter ist hier eine Variante von ComparisonFunctionFilter
            // Die Eigenschaften operator und value sind hier Pflicht und typisiert durch FunctionReturnType
            const comparisonFuncFilter = basicFilter as FilterWithFunction; // Breiterer Cast, um auf operator/value zuzugreifen

            if (comparisonFuncFilter.operator === undefined || (comparisonFuncFilter.value === undefined && comparisonFuncFilter.value !== null) ) {
                 throw new Error(`Operator and value are required for comparing the result of function type "${currentFunction.type}" on field "${fieldPath}".`);
            }
            const removeQuotesForFunctionValue = 'removeQuotes' in comparisonFuncFilter && comparisonFuncFilter.removeQuotes === true;

            const valueForComparison = this.formatValue(
                comparisonFuncFilter.value,
                removeQuotesForFunctionValue,
            );
            return `${functionCallString} ${comparisonFuncFilter.operator} ${valueForComparison}`;
        }
    }

    // --- Code for non-function filters (StandardFilter) ---
    const standardFilter = basicFilter as StandardFilter<U, unknown>;

    if (standardFilter.operator === undefined || (standardFilter.value === undefined && standardFilter.value !== null)) {
        throw new Error(`Operator and value are required for standard filter on field "${fieldPath}".`);
    }

    const transformedField = this.getTransformedFieldStandard(standardFilter);

    if (standardFilter.value === null) {
        return `${transformedField} ${standardFilter.operator} null`;
    }

    const valueType = getValueType(standardFilter.value);
    if (valueType === 'unknown') {
        throw new Error(
            `Unsupported value type: ${typeof standardFilter.value} on field "${fieldPath}".`,
        );
    }
    this.validateOperator(
        valueType,
        standardFilter.operator as FilterOperators<unknown>,
    );

    if (standardFilter.value instanceof Date) {
            const dateValue: Date = standardFilter.value;

            const dateStandardFilter = standardFilter as StandardFilter<U, Date>;

            if (dateStandardFilter.transform && dateStandardFilter.transform.length > 0) {
                const transformedValue = this.applyDateTransforms(
                    dateValue,
                    dateStandardFilter.transform,
                );
                return `${transformedField} ${dateStandardFilter.operator} ${transformedValue}`;
            } else {
                const isoDate = dateValue.toISOString();
                return `${transformedField} ${dateStandardFilter.operator} ${isoDate}`;
            }
        }

    if (typeof standardFilter.value === 'string') {
        let processedValue = standardFilter.value;
        const stringStandardFilter = standardFilter as StandardFilter<U, string>;
        if (stringStandardFilter.ignoreCase) {
            processedValue = processedValue.toLowerCase();
        }
        const valueStr = stringStandardFilter.removeQuotes
            ? processedValue
            : `'${processedValue.replace(/'/g, "''")}'`;
        const op = stringStandardFilter.operator as StringFilterOperators;
        switch (op) {
            case 'contains':
            case 'startswith':
            case 'endswith':
                return `${op}(${transformedField}, ${valueStr})`;
            case 'substringof':
                return `substringof(${valueStr}, ${transformedField})`;
            case 'indexof':
                return `indexof(${transformedField}, ${valueStr})`;
            default:
                return `${transformedField} ${op} ${valueStr}`;
        }
    }

    if (typeof standardFilter.value === 'number') {
        return `${transformedField} ${standardFilter.operator} ${standardFilter.value}`;
    }
    return `${transformedField} ${standardFilter.operator} ${String(standardFilter.value)}`;
}

public visitLambdaFilter<U>(
    filter: LambdaFilter<U>,
    parentLambdaVar?: string,
): string {
    if (!filter.expression || typeof filter.expression !== 'object') {
        throw new Error(
            `Invalid LambdaFilter on field "${String(filter.field)}": "expression" property is missing or not an object.`,
        );
    }

    const currentLambdaVar = parentLambdaVar
        ? String.fromCharCode(parentLambdaVar.charCodeAt(0) + 1)
        : 's';
    const collectionFieldPath = String(filter.field);
    const odataCollectionPath = this.getPrefixedField(
        collectionFieldPath,
        parentLambdaVar,
    );
    const expressionQuery = this.visitExpression(
        filter.expression,
        currentLambdaVar,
    );
    return `${odataCollectionPath}/${filter.lambdaOperator}(${currentLambdaVar}: ${expressionQuery})`;
}

private visitExpression<ExprType>(
    expression: QueryFilter<ExprType> | CombinedFilter<ExprType>,
    lambdaVarContext?: string,
): string {
    if (typeof expression !== 'object' || expression === null) {
        throw new Error(
            `Invalid expression encountered: expression is not an object or is null. Value: ${String(expression)}`,
        );
    }

    if (isGloballyCombinedFilter(expression)) {
        if (
            !Array.isArray(
                (expression as CombinedFilter<ExprType>).filters,
            )
        ) {
            throw new Error(
                'Invalid CombinedFilter: "filters" property is missing or not an array.',
            );
        }
        return this.visitCombinedFilter(
            expression as CombinedFilter<ExprType>,
            lambdaVarContext,
        );
    }
    if (this.isLambdaFilterInternal(expression)) {
        return this.visitLambdaFilter(
            expression as LambdaFilter<ExprType>,
            lambdaVarContext,
        );
    }
    if (isTrulyBasicFilter(expression)) {
        const basicFilter = expression as BaseFilterVariant<ExprType>;
        const basicExprField = String(basicFilter.field);
        const actualFieldPath: string = basicExprField as string;

        const prefixedField =
            actualFieldPath === ''
                ? lambdaVarContext
                : this.getPrefixedField(actualFieldPath, lambdaVarContext);

        const fieldToUse = prefixedField || actualFieldPath;
        const basicQueryFilterWithCorrectedField = {
            ...basicFilter,
            field: fieldToUse as FilterFields<ExprType, unknown>,
        } as QueryFilter<ExprType>;
        return this.visitBasicFilter(basicQueryFilterWithCorrectedField);
    }
    throw new Error(
        `Unsupported expression type in visitExpression. Expression: ${JSON.stringify(expression)}`,
    );
}

public visitCombinedFilter<U>(
    filter: CombinedFilter<U>,
    lambdaVarContext?: string,
): string {
    if (!filter.filters || !Array.isArray(filter.filters)) {
        throw new Error(
            'Invalid CombinedFilter: "filters" property is missing or not an array.',
        );
    }
    if (filter.filters.length === 0) {
        return '';
    }
    const combinedQueries = filter.filters
        .map(subFilter => {
            if (typeof subFilter !== 'object' || subFilter === null) {
                throw new Error(
                    `Invalid sub-filter in CombinedFilter: sub-filter is not an object or is null. Value: ${String(subFilter)}`,
                );
            }
            return this.visitExpression(subFilter, lambdaVarContext);
        })
        .filter(q => q && q.length > 0)
        .join(` ${filter.logic} `);

    if (combinedQueries.length > 0) {
        if (
            filter.filters.length === 1 &&
            combinedQueries.startsWith('(') &&
            combinedQueries.endsWith(')')
        ) {
            return combinedQueries;
        }
        return `(${combinedQueries})`;
    }
    return '';
}

private getTransformedFieldForFunction<U>(filter: BaseFilterVariant<U>): string {
    const fieldStr = String(filter.field);
    let currentField: string = fieldStr as string;
    if (
        filter.transform &&
        Array.isArray(filter.transform) &&
        filter.transform.length > 0
    ) {
        const transformNames = filter.transform as ReadonlyArray<string>;
        currentField = transformNames.reduce(
            (acc, transformName) => `${transformName}(${acc})`,
            currentField,
        );
    }
    return currentField;
}

private getTransformedFieldStandard<U>(filter: StandardFilter<U, unknown>): string {
    const fieldStr = String(filter.field);
    let currentField: string = fieldStr as string;

    if (typeof filter.value === 'string' && filter.ignoreCase) {
        currentField = `tolower(${currentField})`;
    }

    if (
        filter.transform &&
        Array.isArray(filter.transform) &&
        filter.transform.length > 0
    ) {
        const transformNames = filter.transform as ReadonlyArray<string>;
        currentField = transformNames.reduce(
            (acc, transformName) => `${transformName}(${acc})`,
            currentField,
        );
    }
    return currentField;
}


private applyDateTransforms(
    date: Date,
    transforms: ReadonlyArray<DateTransform>,
): number {
    const dateTransformsMap: Record<DateTransform, (d: Date) => number> = {
        year: d => d.getUTCFullYear(),
        month: d => d.getUTCMonth() + 1,
        day: d => d.getUTCDate(),
        hour: d => d.getUTCHours(),
        minute: d => d.getUTCMinutes(),
        second: d => d.getUTCSeconds(),
    };
    if (!transforms || transforms.length === 0) { // Sicherstellen, dass transforms ein Array und nicht leer ist
            throw new Error("applyDateTransforms called with an invalid or empty transforms array.");
        }
    // OData typically does not chain these: year(month(date)) is invalid.
    // We apply only the first transform.
    const transformToApply: DateTransform = transforms[0]!;
     if (!(transformToApply in dateTransformsMap)) {
             throw new Error(`Unsupported DateTransform: ${String(transformToApply)}`);
        }

    const transformFn = dateTransformsMap[transformToApply];
    if (!transformFn)
        throw new Error(`Unsupported DateTransform: ${transformToApply}`);
    
    const result = transformFn(date);
    if (typeof result !== 'number') // Should be guaranteed by DateTransform return types
        throw new Error(
            `Date transformation did not result in a number. Transform: ${String(transformToApply)}. Res: ${String(result)}`,
        );
    return result;
}

private processFunction<U>(
    func: AnySupportedFunction<U>,
    field: string,
): string {
    const fieldAccess: string = field;
    switch (func.type) {
        case 'concat':
            if (!func.values || !Array.isArray(func.values))
                throw new Error(
                    "Invalid function definition for 'concat': 'values' array is missing or not an array.",
                );
            break;
        case 'contains':
        case 'endswith':
        case 'indexof':
        case 'startswith':
            if (func.value === undefined)
                throw new Error(
                    `Invalid function definition for '${func.type}': 'value' property is missing.`,
                );
            break;
        case 'substring':
            if (func.start === undefined)
                throw new Error(
                    "Invalid function definition for 'substring': 'start' property is missing.",
                );
            break;
        case 'add':
        case 'sub':
        case 'mul':
        case 'div':
        case 'mod':
            if (
                (
                    func as Extract<
                        ArithmeticFunctionDefinition<U>,
                        { type: ArithmeticOperator }
                    >
                ).operand === undefined
            )
                throw new Error(
                    `Invalid function definition for '${func.type}': 'operand' property is missing.`,
                );
            break;
        case 'date':
        case 'time':
            const fieldRefForDateOrTime = (
                func as Extract<
                    DateFunctionDefinition<U>,
                    { type: 'date' | 'time' }
                >
            ).field;
            if (fieldRefForDateOrTime === undefined)
                throw new Error(
                    `Invalid function definition for '${func.type}': 'field' property is missing.`,
                );
            this.validateFieldReference(fieldRefForDateOrTime);
            break;
        case 'length':
        case 'tolower':
        case 'toupper':
        case 'trim':
        case 'round':
        case 'floor':
        case 'ceiling':
        case 'now':
        case 'year':
        case 'month':
        case 'day':
        case 'hour':
        case 'minute':
        case 'second':
            break;
        default: {
            const _exhaustiveCheck: never = func;
            throw new Error(
                `Unhandled preliminary check for function type in processFunction: ${(_exhaustiveCheck as AnySupportedFunction<U>).type}`,
            );
        }
    }

    switch (func.type) {
        case 'concat':
            return `concat(${fieldAccess}, ${func.values.map(v => (typeof v === 'string' ? this.formatValue(v) : this.resolveFieldReference(v as FieldReference<U, string>))).join(', ')})`;
        case 'contains':
            return `contains(${fieldAccess}, ${typeof func.value === 'string' ? this.formatValue(func.value) : this.resolveFieldReference(func.value as FieldReference<U, string>)})`;
        case 'endswith':
            return `endswith(${fieldAccess}, ${typeof func.value === 'string' ? this.formatValue(func.value) : this.resolveFieldReference(func.value as FieldReference<U, string>)})`;
        case 'indexof':
            return `indexof(${fieldAccess}, ${typeof func.value === 'string' ? this.formatValue(func.value) : this.resolveFieldReference(func.value as FieldReference<U, string>)})`;
        case 'length':
            return `length(${fieldAccess})`;
        case 'startswith':
            return `startswith(${fieldAccess}, ${typeof func.value === 'string' ? this.formatValue(func.value) : this.resolveFieldReference(func.value as FieldReference<U, string>)})`;
        case 'substring': {
            const startArg =
                typeof func.start === 'number'
                    ? this.formatValue(func.start)
                    : this.resolveFieldReference(
                          func.start as FieldReference<U, number>,
                      );
            const argsStr = [startArg];
            if (func.length !== undefined) {
                const lengthArg =
                    typeof func.length === 'number'
                        ? this.formatValue(func.length)
                        : this.resolveFieldReference(
                              func.length as FieldReference<U, number>,
                          );
                argsStr.push(lengthArg);
            }
            return `substring(${fieldAccess}, ${argsStr.join(', ')})`;
        }
        case 'tolower':
        case 'toupper':
        case 'trim':
            return `${func.type}(${fieldAccess})`;
        case 'add':
        case 'sub':
        case 'mul':
        case 'div':
        case 'mod': {
            const arithFunc = func as Extract<
                ArithmeticFunctionDefinition<U>,
                { type: ArithmeticOperator }
            >;
            const operandStr =
                typeof arithFunc.operand === 'number'
                    ? this.formatValue(arithFunc.operand)
                    : this.resolveFieldReference(
                          arithFunc.operand as FieldReference<U, number>,
                      );
            return `${fieldAccess} ${arithFunc.type} ${operandStr}`;
        }
        case 'round':
        case 'floor':
        case 'ceiling':
            return `${func.type}(${fieldAccess})`;
        case 'now':
            return 'now()';
        case 'date':
            return `date(${this.resolveFieldReference(func.field)})`;
        case 'time':
            return `time(${this.resolveFieldReference(func.field)})`;
        case 'year':
        case 'month':
        case 'day':
        case 'hour':
        case 'minute':
        case 'second':
            return `${func.type}(${fieldAccess})`;
        default: {
            const _exhaustiveCheck: never = func;
            throw new Error(
                `Unhandled function type in processFunction execution: ${(_exhaustiveCheck as AnySupportedFunction<U>).type}`,
            );
        }
    }
}

private validateFieldReference<
    U,
    Val extends string | number | Date | boolean,
>(fieldRef: FieldReference<U, Val> | undefined | null): void {
    if (
        typeof fieldRef !== 'object' ||
        fieldRef === null ||
        !('fieldReference' in fieldRef) ||
        typeof fieldRef.fieldReference !== 'string' ||
        !(fieldRef.fieldReference as string).trim()
    ) {
        throw new Error(
            "Invalid FieldReference: It must be an object with a 'fieldReference' property that is a non-empty string.",
        );
    }
}

private resolveFieldReference<
    U,
    Val extends string | number | Date | boolean,
>(fieldRef: FieldReference<U, Val>): string {
    this.validateFieldReference(fieldRef);
    return fieldRef.fieldReference as string;
}

private formatValue(value: unknown, removeQuotes = false): string {
    if (value === null) return 'null';
    if (typeof value === 'string')
        return removeQuotes ? value : `'${value.replace(/'/g, "''")}'`;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    throw new Error(
        `Unsupported value type for formatting: ${typeof value}`,
    );
}

private getPrefixedField(
    field: string | number | symbol,
    prefix?: string,
): string {
    const fieldStr = String(field);
    const fieldAsString: string = fieldStr as string;

    if (!prefix) return fieldAsString;
    if (fieldAsString === '') return prefix;
    return `${prefix}/${fieldAsString}`;
}

private validateOperator<V>(
    type: string,
    operator: FilterOperators<V>,
): void {
    if (!isValidOperator(type, operator as string)) {
        throw new Error(
            `Invalid operator "${String(operator)}" for value type "${type}"`,
        );
    }
}

private isLambdaFilterInternal<InputType>(
    filter: unknown,
): filter is LambdaFilter<InputType> {
    if (typeof filter !== 'object' || filter === null) return false;
    const f = filter as Record<string, unknown>;
    return (
        'lambdaOperator' in f &&
        (f['lambdaOperator'] === 'any' || f['lambdaOperator'] === 'all') &&
        'expression' in f &&
        f['expression'] !== null &&
        typeof f['expression'] === 'object' &&
        'field' in f &&
        (isTrulyBasicFilter(f['expression']) ||
            isGloballyCombinedFilter(f['expression']) ||
            this.isLambdaFilterInternal(f['expression']))
    );
}

}
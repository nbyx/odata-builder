import { OrderByDescriptor } from './types/orderby/orderby-descriptor.type';
import { QueryFilter } from './types/filter/query-filter.type';
import { toOrderByQuery } from './utils/orderby/orderby-utils';
import { toSelectQuery } from './utils/select/select-utils';
import { isBasicFilter, toFilterQuery } from './utils/filter/filter-utils';
import { CombinedFilter } from './types/filter/combined-filter.type';
import { ExpandFields } from './types/expand/expand-fields.type';
import { toExpandQuery } from './utils/expand/expand-util';
import { toTopQuery } from './utils/top/top-utils';
import { toSkipQuery } from './utils/skip/skip-utils';
import { QueryComponents } from './types/utils/util.types';
import { SearchExpressionBuilder } from './builder/search-expression-builder';
import { isCombinedFilter } from './utils/filter/combined-filter-util';
import {
    getValueType,
    isValidOperator,
} from './utils/filter/filter-helper.util';
import { ArrayElement, ArrayFields } from './types/filter/query-filter.type';

const countEntitiesQuery = '/$count';

function isValidSearchInput(
    value: unknown,
): value is string | SearchExpressionBuilder {
    return (
        typeof value === 'string' || value instanceof SearchExpressionBuilder
    );
}

function isValidOrderByDescriptor<T>(
    descriptor: OrderByDescriptor<T>,
): boolean {
    return (
        descriptor !== null &&
        typeof descriptor === 'object' &&
        'field' in descriptor &&
        typeof descriptor.field === 'string' &&
        descriptor.field.trim() !== '' &&
        (!('orderDirection' in descriptor) ||
            descriptor.orderDirection === 'asc' ||
            descriptor.orderDirection === 'desc')
    );
}

export class OdataQueryBuilder<T> {
    private queryComponents: QueryComponents<T> = {};

    public top(topCount: number): this {
        if (topCount === null || topCount === undefined) return this;
        if (
            typeof topCount !== 'number' ||
            !Number.isFinite(topCount) ||
            topCount < 0
        ) {
            throw new Error(
                'Invalid top count: Must be a non-negative finite number.',
            );
        }
        if (
            this.queryComponents.top !== undefined &&
            this.queryComponents.top !== topCount
        ) {
            console.warn(
                'Overwriting existing top value. Multiple calls to top() will use the last valid value.',
            );
        }
        if (topCount > 0) {
            this.queryComponents.top = topCount;
        } else {
            delete this.queryComponents.top;
        }
        return this;
    }

    public skip(skipCount: number): this {
        if (skipCount === null || skipCount === undefined) return this;
        if (
            typeof skipCount !== 'number' ||
            !Number.isFinite(skipCount) ||
            skipCount < 0
        ) {
            throw new Error(
                'Invalid skip count: Must be a non-negative finite number.',
            );
        }
        if (
            this.queryComponents.skip !== undefined &&
            this.queryComponents.skip !== skipCount
        ) {
            console.warn(
                'Overwriting existing skip value. Multiple calls to skip() will use the last valid value.',
            );
        }

        if (skipCount > 0) {
            this.queryComponents.skip = skipCount;
        } else {
            delete this.queryComponents.skip;
        }
        return this;
    }

    public select(
        ...selectProps: ReadonlyArray<Extract<keyof Required<T>, string>>
    ): this {
        if (selectProps === null || selectProps === undefined) {
            if (
                !Array.isArray(selectProps) &&
                arguments.length === 1 &&
                (arguments[0] === null || arguments[0] === undefined)
            ) {
                throw new Error(
                    'Invalid select input: Argument cannot be null or undefined. Pass an array or individual strings.',
                );
            }
        }

        if (
            selectProps.length === 0 &&
            arguments.length > 0 &&
            (arguments[0] === null || arguments[0] === undefined)
        ) {
            throw new Error(
                'Invalid select input: All properties must be non-empty strings.',
            );
        }
        if (selectProps.length === 0) return this;

        if (
            selectProps.some(prop => typeof prop !== 'string' || !prop.trim())
        ) {
            throw new Error(
                'Invalid select input: All properties must be non-empty strings.',
            );
        }
        this.addComponent(
            'select',
            selectProps.map(p => p.trim()).filter(p => p),
        );
        return this;
    }

    public filter(
        ...filters: ReadonlyArray<
            CombinedFilter<Required<T>> | QueryFilter<Required<T>>
        >
    ): this {
        if (filters === null || filters === undefined) {
            if (
                arguments.length === 1 &&
                (arguments[0] === null || arguments[0] === undefined)
            ) {
                throw new Error(
                    'Invalid filter input: Argument cannot be null or undefined. Pass an array or individual filter objects.',
                );
            }
        }
        if (
            filters.length === 0 &&
            arguments.length > 0 &&
            (arguments[0] === null || arguments[0] === undefined)
        ) {
            throw new Error(
                'Invalid filter input: Filter cannot be null or undefined.',
            );
        }
        if (filters.length === 0) return this;

        for (const filter of filters) {
            if (!filter) {
                throw new Error(
                    'Invalid filter input: Filter array contains null or undefined element.',
                );
            }
            if (isBasicFilter(filter)) {
                if (filter.value !== null) {
                    const valueType = getValueType(filter.value);
                    if (
                        !isValidOperator(valueType, filter.operator as string)
                    ) {
                        throw new Error(
                            `Invalid operator "${String(filter.operator)}" for type "${valueType}" on field "${String(filter.field)}".`,
                        );
                    }
                }
            } else if (this.isLambdaFilterInternal(filter)) {
            } else if (!isCombinedFilter(filter)) {
                throw new Error(
                    `Invalid filter input structure: ${JSON.stringify(filter)}`,
                );
            }
        }
        this.addComponent('filter', filters);
        return this;
    }

    public expand(
        ...expandFields: ReadonlyArray<ExpandFields<Required<T>>>
    ): this {
        if (expandFields === null || expandFields === undefined) {
            if (
                arguments.length === 1 &&
                (arguments[0] === null || arguments[0] === undefined)
            ) {
                throw new Error(
                    'Invalid expand input: Argument cannot be null or undefined. Pass an array or individual strings.',
                );
            }
        }
        if (
            expandFields.length === 0 &&
            arguments.length > 0 &&
            (arguments[0] === null || arguments[0] === undefined)
        ) {
            throw new Error(
                'Invalid expand input: All fields must be non-empty strings.',
            );
        }
        if (expandFields.length === 0) return this;

        if (
            expandFields.some(
                field => typeof field !== 'string' || !field.trim(),
            )
        ) {
            throw new Error(
                'Invalid expand input: All fields must be non-empty strings.',
            );
        }
        this.addComponent(
            'expand',
            expandFields.map(f => f.trim()).filter(f => f) as ExpandFields<
                Required<T>
            >[],
        );
        return this;
    }

    public count(countEntities = false): this {
        const newCountValue = countEntities
            ? countEntitiesQuery
            : '$count=true';
        if (
            this.queryComponents.count !== undefined &&
            this.queryComponents.count !== newCountValue
        ) {
            console.warn(
                'Overwriting existing count setting. Multiple calls to count() will use the last setting.',
            );
        }
        this.queryComponents.count = newCountValue;
        return this;
    }

    public orderBy(
        ...orderByInput: ReadonlyArray<
            OrderByDescriptor<Required<T>> | null | undefined
        >
    ): this {
        if (!orderByInput || orderByInput.length === 0) {
            if (
                arguments.length === 1 &&
                (arguments[0] === null || arguments[0] === undefined)
            ) {
                return this;
            }
            if (orderByInput.length === 0) return this;
        }

        const validOrderByDescriptors = orderByInput.filter(
            (desc): desc is OrderByDescriptor<Required<T>> =>
                isValidOrderByDescriptor(
                    desc as OrderByDescriptor<Required<T>>,
                ),
        );

        if (validOrderByDescriptors.length === 0) {
            return this;
        }

        this.addComponent('orderBy', validOrderByDescriptors);
        return this;
    }

    public search(
        searchExpression: string | SearchExpressionBuilder | null | undefined,
    ): this {
        if (searchExpression === null || searchExpression === undefined) {
            delete this.queryComponents.search;
            return this;
        }

        if (!isValidSearchInput(searchExpression)) {
            throw new Error(
                'Invalid search input. Must be a non-empty string or an instance of SearchExpressionBuilder.',
            );
        }

        let searchTermString: string;
        if (typeof searchExpression === 'string') {
            searchTermString = searchExpression.trim();
            if (searchTermString === '') {
                delete this.queryComponents.search;
                return this;
            }
        } else {
            searchTermString = searchExpression.toString().trim();
            if (searchTermString === '') {
                delete this.queryComponents.search;
                return this;
            }
        }
        this.queryComponents.search = searchTermString;
        return this;
    }

    public toQuery(): string {
        const queryGeneratorMap: {
            [K in keyof QueryComponents<T>]-?: (
                component: NonNullable<QueryComponents<T>[K]>,
            ) => string;
        } = {
            count: component => component,
            filter: component => toFilterQuery(Array.from(component)),
            top: component => toTopQuery(component),
            skip: component => toSkipQuery(component),
            select: component => toSelectQuery(Array.from(component)),
            expand: component =>
                toExpandQuery<Required<T>>(Array.from(component)),
            orderBy: component => toOrderByQuery(Array.from(component)),
            search: component =>
                component ? `$search=${encodeURIComponent(component)}` : '',
        };

        const componentOrder: ReadonlyArray<keyof QueryComponents<T>> = [
            'count',
            'filter',
            'search',
            'top',
            'skip',
            'select',
            'orderBy',
            'expand',
        ];

        const queryStringParts: string[] = [];

        for (const key of componentOrder) {
            const currentKey = key as keyof QueryComponents<T>;
            const componentValue = this.queryComponents[currentKey];

            if (componentValue !== undefined && componentValue !== null) {
                const specificQueryFn = queryGeneratorMap[currentKey] as (
                    comp: any,
                ) => string;
                const queryPart = specificQueryFn(
                    componentValue as NonNullable<typeof componentValue>,
                );
                if (queryPart) {
                    queryStringParts.push(queryPart);
                }
            }
        }

        let queryString = queryStringParts.join('&');

        if (
            this.queryComponents.count === countEntitiesQuery &&
            queryString.startsWith(countEntitiesQuery)
        ) {
            const remainingQueryString = queryString.substring(
                countEntitiesQuery.length,
            );
            if (remainingQueryString.startsWith('&')) {
                return `${countEntitiesQuery}?${remainingQueryString.substring(1)}`;
            } else if (remainingQueryString === '') {
                return countEntitiesQuery;
            }
            return `${countEntitiesQuery}${remainingQueryString}`;
        }

        return queryString.length > 0 ? `?${queryString}` : '';
    }

    private addComponent<
        K extends keyof Pick<
            QueryComponents<T>,
            'select' | 'filter' | 'expand' | 'orderBy'
        >,
        U = NonNullable<QueryComponents<T>[K]> extends Set<infer V> ? V : never,
    >(type: K, values: ReadonlyArray<U>): this {
        if (!values || values.length === 0) return this;

        if (!this.queryComponents[type]) {
            this.queryComponents[type] = new Set() as QueryComponents<T>[K];
        }

        const componentSet = this.queryComponents[type] as Set<U>;
        for (const value of values) {
            if (value !== null && value !== undefined) {
                componentSet.add(value);
            }
        }
        return this;
    }

    private isLambdaFilterInternal<LambdaInputType>(
        filter: unknown,
    ): filter is QueryFilter<LambdaInputType> & {
        lambdaOperator: 'any' | 'all';
        expression:
            | QueryFilter<
                  ArrayElement<LambdaInputType, ArrayFields<LambdaInputType>>
              >
            | CombinedFilter<
                  ArrayElement<LambdaInputType, ArrayFields<LambdaInputType>>
              >;
    } {
        if (typeof filter !== 'object' || filter === null) return false;
        const f = filter as Record<string, unknown>;
        return (
            'lambdaOperator' in f &&
            (f['lambdaOperator'] === 'any' || f['lambdaOperator'] === 'all') &&
            'expression' in f &&
            f['expression'] !== null &&
            typeof f['expression'] === 'object' &&
            'field' in f &&
            (isBasicFilter(f['expression']) ||
                isCombinedFilter(f['expression']) ||
                this.isLambdaFilterInternal(f['expression']))
        );
    }
}

import { OrderByDescriptor } from './types/orderby/orderby-descriptor.type';
import { QueryFilter } from './types/filter/query-filter.type';
import { toOrderByQuery } from './utils/orderby/orderby-utils';
import { toSelectQuery } from './utils/select/select-utils';
import { toFilterQuery } from './utils/filter/filter-utils';
import { CombinedFilter } from './types/filter/combined-filter.type';
import { ExpandFields } from './types/expand/expand-fields.type';
import { toExpandQuery } from './utils/expand/expand-util';
import { toTopQuery } from './utils/top/top-utils';
import { toSkipQuery } from './utils/skip/skip-utils';
import { QueryComponents } from './types/utils/util.types';
import { SearchExpressionBuilder } from './builder/search-expression-builder';
import { createSearchTerm } from './utils/search/search.utils';

const countEntitiesQuery = '/$count';
export class OdataQueryBuilder<T> {
    private queryComponents: QueryComponents<T> = {};

    top(topCount: number): this {
        if (!topCount || this.queryComponents.top) return this;
        if (topCount < 0) throw new Error('Invalid top count');

        this.queryComponents.top = topCount;

        return this;
    }

    skip(skipCount: number): this {
        if (!skipCount || this.queryComponents.skip) return this;
        if (skipCount < 0) throw new Error('Invalid skip count');

        this.queryComponents.skip = skipCount;

        return this;
    }

    select(...selectProps: Extract<keyof Required<T>, string>[]): this {
        if (selectProps.length === 0) return this;
        if (selectProps.some(prop => !prop))
            throw new Error('Invalid select input');

        return this.addComponent('select', selectProps);
    }

    filter(
        ...filters: (CombinedFilter<Required<T>> | QueryFilter<Required<T>>)[]
    ): this;
    // filter<VALUE extends string>(
    //     ...filters: FilterString<T, VALUE>[]
    // ): OdataQueryBuilder<T>;

    filter(
        ...filters: Array<
            CombinedFilter<Required<T>> | QueryFilter<Required<T>>
        >
    ): this {
        if (filters.length === 0) return this;

        if (filters.some(filter => !filter))
            throw new Error('Invalid filter input');

        return this.addComponent('filter', filters);
    }

    expand(...expandFields: ExpandFields<T>[]): this {
        if (expandFields.length === 0) return this;
        if (expandFields.some(field => !field))
            throw new Error('Field missing for expand');

        return this.addComponent('expand', expandFields);
    }

    count(countEntities = false): this {
        if (this.queryComponents.count) return this;

        this.queryComponents.count = countEntities
            ? countEntitiesQuery
            : '$count=true';

        return this;
    }

    orderBy(...orderBy: OrderByDescriptor<Required<T>>[]): this {
        if (orderBy.length === 0) return this;

        return this.addComponent('orderBy', orderBy);
    }

    search(searchExpression: string | SearchExpressionBuilder): this {
        if (!searchExpression) {
            delete this.queryComponents.search;
            return this;
        }

        this.queryComponents.search =
            typeof searchExpression === 'string'
                ? createSearchTerm(searchExpression)
                : searchExpression.toString();
        return this;
    }

    toQuery(): string {
        const queryGeneratorMap: Record<
            keyof QueryComponents<T>,
            (component: QueryComponents<T>[keyof QueryComponents<T>]) => string
        > = {
            count: component => component as string,
            filter: component =>
                toFilterQuery(Array.from(component as Set<QueryFilter<T>>)),
            top: component => toTopQuery(component as number),
            skip: component => toSkipQuery(component as number),
            select: component =>
                toSelectQuery(
                    Array.from(component as Set<Extract<keyof T, string>>),
                ),
            expand: component =>
                toExpandQuery<T>(Array.from(component as Set<ExpandFields<T>>)),
            orderBy: component =>
                toOrderByQuery(
                    Array.from(component as Set<OrderByDescriptor<T>>),
                ),
            search: component =>
                `$search=${encodeURIComponent(component as string)}`,
        };

        const sortedEntries = Object.entries(this.queryComponents).sort(
            ([a], [b]) => {
                const orderA = Object.keys(queryGeneratorMap).indexOf(a);
                const orderB = Object.keys(queryGeneratorMap).indexOf(b);
                return orderA - orderB;
            },
        );

        const queryStringParts: string[] = [];

        for (const [operator, component] of sortedEntries) {
            if (!component) continue;

            const queryPart = queryGeneratorMap[
                operator as keyof QueryComponents<T>
            ](component as QueryComponents<T>[keyof QueryComponents<T>]);
            if (!queryPart) continue;

            queryStringParts.push(queryPart);
        }

        const queryString = queryStringParts.join('&');

        if (queryString.startsWith('/$count')) {
            const remainingQueryString = queryString.slice('/$count'.length);

            if (remainingQueryString.length > 0)
                return `/$count?${remainingQueryString.substring(1)}`;

            return '/$count';
        }

        return queryString.length > 0 ? `?${queryString}` : '';
    }

    private addComponent<
        K extends keyof QueryComponents<T>,
        U = NonNullable<QueryComponents<T>[K]> extends Set<infer V> ? V : never,
    >(type: K, values: U[]): this {
        if (values.length === 0) return this;

        if (!this.queryComponents[type]) {
            this.queryComponents[type] = new Set() as QueryComponents<T>[K];
        }

        const componentSet = this.queryComponents[type] as unknown as Set<U>;
        for (const value of values) {
            componentSet.add(value);
        }

        return this;
    }
}

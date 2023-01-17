import {
    ODataOperators,
    OperatorOrder,
} from './types/operator/odata-query-operator.type';
import { OrderByDescriptor } from './types/orderby/orderby-descriptor.type';
import { QueryFilter } from './types/filter/query-filter.type';
import { isQueryFilter } from './utils/filter/is-query-filter-util';
import { toOrderByQuery } from './utils/orderby/orderby-utils';
import { toSelectQuery } from './utils/select/select-utils';
import { toFilterQuery } from './utils/filter/filter-utils';
import { CombinedFilter } from './types/filter/combined-filter.type';
import { isCombinedFilter } from './utils/filter/combined-filter-util';
import { ExpandFields } from './types/expand/expand-fields.type';
import { toExpandQuery } from './utils/expand/expand-util';
import { toTopQuery } from './utils/top/top-utils';
import { toSkipQuery } from './utils/skip/skip-utils';

const countEntitiesQuery = '/$count';
export class OdataQueryBuilder<T> {
    private countQuery: string;
    private topCount: number;
    private skipCount: number;
    private operatorOrder: OperatorOrder;
    private selectProps: Set<Extract<keyof T, string>>;
    private orderByProps: Set<OrderByDescriptor<T>>;
    private filterProps: Set<
        CombinedFilter<Required<T>> | QueryFilter<Required<T>>
    >;
    private expandProps: Set<ExpandFields<Required<T>>>;

    constructor() {
        this.countQuery = '';
        this.topCount = 0;
        this.skipCount = 0;
        this.selectProps = new Set<Extract<keyof T, string>>();
        this.orderByProps = new Set<OrderByDescriptor<T>>();
        this.filterProps = new Set<
            CombinedFilter<Required<T>> | QueryFilter<Required<T>>
        >();
        this.expandProps = new Set<ExpandFields<Required<T>>>();

        this.operatorOrder = {
            count: () => this.countQuery,
            filter: () =>
                toFilterQuery<Required<T>>.call(
                    this,
                    Array.from(this.filterProps.values()),
                ),
            top: () => toTopQuery.call(this, this.topCount),
            skip: () => toSkipQuery.call(this, this.skipCount),
            select: () =>
                toSelectQuery.call(this, Array.from(this.selectProps.values())),
            expand: () =>
                toExpandQuery<Required<T>>.call(
                    this,
                    Array.from(this.expandProps.values()),
                ),
            orderby: () =>
                toOrderByQuery<Required<T>>.call(
                    this,
                    Array.from(this.orderByProps.values()),
                ),
            search: () => '',
        };
    }

    top(topCount: number): this {
        if (!topCount || this.topCount) return this;
        if (topCount < 0) throw new Error('Invalid top count');

        this.topCount = topCount;

        return this;
    }

    skip(skipCount: number): this {
        if (!skipCount || this.skipCount) return this;
        if (skipCount < 0) throw new Error('Invalid skip count');

        this.skipCount = skipCount;

        return this;
    }

    select(...selectProps: Extract<keyof Required<T>, string>[]): this {
        if (selectProps.length === 0) return this;
        if (selectProps.some(prop => !prop))
            throw new Error('Invalid select input');

        for (const option of selectProps) {
            if (!option) continue;

            this.selectProps.add(option);
        }

        return this;
    }

    filter(
        ...filters: (CombinedFilter<Required<T>> | QueryFilter<Required<T>>)[]
    ): this;
    // filter<VALUE extends string>(
    //     ...filters: FilterString<T, VALUE>[]
    // ): OdataQueryBuilder<T>;

    filter(...filters: unknown[]): this {
        if (filters.length === 0) return this;
        if (filters.some(filter => filter === undefined))
            throw new Error('Invalid filter input');

        for (const filter of filters) {
            if (
                !isQueryFilter<Required<T>>(filter) &&
                !isCombinedFilter<Required<T>>(filter)
            ) {
                throw new Error('Invalid filter');
            }

            this.filterProps.add(filter);
        }

        return this;
    }

    expand(...expandFields: ExpandFields<T>[]): this {
        if (expandFields.length === 0) return this;
        if (expandFields.some(field => !field))
            throw new Error('Field missing for expand');

        for (const expand of expandFields) {
            this.expandProps.add(expand);
        }

        return this;
    }

    count(countEntities = false): this {
        if (this.countQuery) return this;

        this.countQuery = countEntities ? countEntitiesQuery : '$count=true';

        return this;
    }

    orderBy(...orderBy: OrderByDescriptor<Required<T>>[]): this {
        if (orderBy.length === 0) return this;

        for (const option of orderBy) {
            this.orderByProps.add(option);
        }

        return this;
    }

    toQuery(): string {
        const query = Object.keys(this.operatorOrder)
            .map(key => this.operatorOrder[key as ODataOperators]())
            .filter(query => query)
            .join('&');

        if (this.countQuery === countEntitiesQuery) return query;

        return query ? `?${query}` : '';
    }
}

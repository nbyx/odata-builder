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

const countEntitiesQuery = '/$count';
export class OdataQueryBuilder<T> {
    private countQuery: string;
    private topCount: number;
    private skipCount: number;
    private operatorOrder: OperatorOrder;
    private selectProps: Set<Extract<keyof Required<T>, string>>;
    private orderByProps: Set<OrderByDescriptor<Required<T>>>;
    private filterProps: Set<
        CombinedFilter<Required<T>> | QueryFilter<Required<T>>
    >;
    private expandProps: Set<ExpandFields<Required<T>>>;

    constructor() {
        this.countQuery = '';
        this.topCount = 0;
        this.skipCount = 0;
        this.selectProps = new Set<Extract<keyof Required<T>, string>>();
        this.orderByProps = new Set<OrderByDescriptor<Required<T>>>();
        this.filterProps = new Set<
            CombinedFilter<Required<T>> | QueryFilter<Required<T>>
        >();
        this.expandProps = new Set<ExpandFields<Required<T>>>();

        this.operatorOrder = {
            count: this.getCountQuery.bind(this),
            filter: this.getFilterQuery.bind(this),
            top: this.getTopQuery.bind(this),
            skip: this.getSkipQuery.bind(this),
            select: this.getSelectQuery.bind(this),
            expand: this.getExpandQuery.bind(this),
            orderby: this.getOrderByQuery.bind(this),
            search: () => '',
        };
    }

    top(topCount: number): this {
        if (!topCount || this.topCount) return this;

        this.topCount = topCount;

        return this;
    }

    skip(skipCount: number): this {
        if (!skipCount || this.skipCount) return this;

        this.skipCount = skipCount;

        return this;
    }

    select(...selectProps: Extract<keyof Required<T>, string>[]): this {
        if (selectProps.length === 0) return this;

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

        for (const filter of filters) {
            if (!filter) continue;

            if (
                isQueryFilter<Required<T>>(filter) ||
                isCombinedFilter<Required<T>>(filter)
            ) {
                this.filterProps.add(filter);
            }
        }

        return this;
    }

    expand(...expandFields: ExpandFields<Required<T>>[]): this {
        if (expandFields.length === 0) return this;

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
        return Object.keys(this.operatorOrder)
            .map(key => this.operatorOrder[key as ODataOperators]())
            .filter(value => value !== '')
            .reduce(
                (prev, curr, index, array) =>
                    prev +
                    `${
                        index === 0 &&
                        array.length > 0 &&
                        this.countQuery !== countEntitiesQuery
                            ? '?'
                            : ''
                    }` +
                    `${prev && index > 0 ? '&' : ''}${curr}`,
                '',
            );
    }

    private getTopQuery(): string {
        return this.topCount > 0 ? `$top=${this.topCount}` : '';
    }

    private getSkipQuery(): string {
        return this.skipCount > 0 ? `$skip=${this.skipCount}` : '';
    }

    private getCountQuery(): string {
        return this.countQuery;
    }

    private getSelectQuery(): string {
        return this.selectProps.size > 0
            ? toSelectQuery(Array.from(this.selectProps.values()))
            : '';
    }

    private getOrderByQuery(): string {
        return this.orderByProps.size > 0
            ? toOrderByQuery(Array.from(this.orderByProps.values()))
            : '';
    }

    private getFilterQuery(): string {
        return this.filterProps.size > 0
            ? toFilterQuery(Array.from(this.filterProps.values()))
            : '';
    }

    private getExpandQuery(): string {
        return this.expandProps.size > 0
            ? toExpandQuery(Array.from(this.expandProps.values()))
            : '';
    }
}

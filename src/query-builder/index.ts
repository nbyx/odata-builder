import { ODataOperators, OperatorOrder } from './types/odata-query-operator.type';
import { OrderByDescriptor } from './types/orderby-descriptor.type';
import { toOrderByQuery, toSelectQuery } from './utils/operator-utils';

export const countEntitiesQuery = '/$count';
export class OdataQueryBuilder<T> {
    private countQuery: string;
    private topCount: number;
    private skipCount: number;
    private operatorOrder: OperatorOrder;
    private selectProps: Set<Extract<keyof T, string>>;
    private orderByProps: Set<OrderByDescriptor<T>>;

    constructor() {
        this.countQuery = '';
        this.topCount = 0;
        this.skipCount = 0;
        this.selectProps = new Set<Extract<keyof T,string>>();
        this.orderByProps = new Set<OrderByDescriptor<T>>();

        this.operatorOrder = {
            count: this.getCountQuery.bind(this),
            filter: () => '',
            top: this.getTopQuery.bind(this),
            skip: this.getSkipQuery.bind(this),
            select: this.getSelectQuery.bind(this),
            expand: () => '',
            orderby: this.getOrderByQuery.bind(this),
            search: () => '',
        }
    }

    top(topCount: number): OdataQueryBuilder<T> {
        if (!topCount || this.topCount) return this;

        this.topCount = topCount;

        return this;
    }

    skip(skipCount: number): OdataQueryBuilder<T> {
        if (!skipCount || this.skipCount) return this;

        this.skipCount = skipCount;

        return this;
    }

    select(...selectProps: Extract<keyof T, string>[]): OdataQueryBuilder<T> {
        if (!selectProps || selectProps.length === 0) return this;

        for(const option of selectProps) {
            if (!option) continue;

            this.selectProps.add(option);
        }

        return this;
    }

    count(countEntities = false): OdataQueryBuilder<T> {
        if (this.countQuery) return this;

        this.countQuery = countEntities ? countEntitiesQuery : '$count=true';

        return this;
    }

    orderBy(...orderBy: OrderByDescriptor<T>[]): OdataQueryBuilder<T> {
        if (!orderBy || orderBy.length === 0) return this;

        for (const option of orderBy) {
            if (!option) continue;

            this.orderByProps.add(option);
        }

        return this;
    }

    toQuery(): string {
       return Object.keys(this.operatorOrder)
            .map(key => this.operatorOrder[key as ODataOperators]())
            .filter(value => value !== '')
            .reduce((prev, curr, index, array) => 
                prev + `${index === 0 && array.length > 0 && this.countQuery !== countEntitiesQuery ? '?' : ''}` + `${prev && index > 0 ? '&' : ''}${curr}`
            , '')
    }

    private getTopQuery(): string {
        return this.topCount > 0 ? `$top=${this.topCount}` : '';
    }

    private getSkipQuery(): string {
        return this.skipCount > 0 ? `$skip=${this.skipCount}` : ''
    }

    private getCountQuery(): string {
        return this.countQuery;
    }

    private getSelectQuery(): string {
        return this.selectProps.size > 0 ? toSelectQuery(Array.from(this.selectProps.values())) : '';
    }

    private getOrderByQuery(): string {
        return this.orderByProps.size > 0 ? toOrderByQuery(Array.from(this.orderByProps.values())) : '';
    }
}

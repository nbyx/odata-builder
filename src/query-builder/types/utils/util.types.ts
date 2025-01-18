import { CombinedFilter } from '../filter/combined-filter.type';
import { QueryFilter } from '../filter/query-filter.type';
import { OrderByDescriptor } from '../orderby/orderby-descriptor.type';
import { ExpandFields } from '../expand/expand-fields.type';

export type Guid = string & { _type: Guid };
export interface GuidFilter {
    value: Guid;
    removeQuotes?: boolean;
}

export interface QueryComponents<T> {
    count?: string;
    filter?: Set<CombinedFilter<Required<T>> | QueryFilter<Required<T>>>;
    top?: number;
    skip?: number;
    select?: Set<Extract<keyof T, string>>;
    orderBy?: Set<OrderByDescriptor<T>>;
    expand?: Set<ExpandFields<Required<T>>>;
}

export type HasKeys<T> = [keyof T] extends [never] ? false : true;

export type PrevDepth<T extends number> = [
    never, // 0
    0, // 1
    1, // 2
    2, // 3
    3, // 4
    4, // 5
][T];

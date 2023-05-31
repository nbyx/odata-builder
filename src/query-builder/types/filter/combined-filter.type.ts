import { QueryFilter } from './query-filter.type';

export interface CombinedFilter<T> {
    logic: 'and' | 'or';
    filters: Array<QueryFilter<T> | CombinedFilter<T>>;
}

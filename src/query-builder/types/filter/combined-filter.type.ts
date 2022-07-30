import { QueryFilter } from './query-filter.type';

export interface CombinedFilter<T> {
    logic: 'and' | 'or';
    filters: QueryFilter<T>[];
}

import { QueryFilter } from './query-filter.type';

export type CombinedFilter<T> = {
    logic: 'and' | 'or';
    filters: QueryFilter<T>;
};

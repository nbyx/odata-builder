import { QueryFilter } from '../types/query-filter.type';

export const isQueryFilter = <T>(filter: unknown): filter is QueryFilter<T> => {
    return (
        !!filter &&
        !!(filter as QueryFilter<T>).field &&
        !!(filter as QueryFilter<T>).operator &&
        !!(filter as QueryFilter<T>).value !== undefined
    );
};

import { QueryFilter } from '../../types/filter/query-filter.type';

export const isQueryFilter = <T>(filter: unknown): filter is QueryFilter<T> => {
    return (
        (!!filter &&
            !!(filter as QueryFilter<T>).field &&
            !!(filter as QueryFilter<T>).operator &&
            (typeof (filter as QueryFilter<T>).value === 'string' ||
                typeof (filter as QueryFilter<T>).value === 'boolean' ||
                typeof (filter as QueryFilter<T>).value === 'number' ||
                (filter as QueryFilter<T>).value instanceof Date)) ||
        (filter as QueryFilter<T>).value === null
    );
};

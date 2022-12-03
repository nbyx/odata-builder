import { CombinedFilter } from 'src/query-builder/types/filter/combined-filter.type';
import {
    QueryFilter,
    StringFilterOperators,
} from 'src/query-builder/types/filter/query-filter.type';
import { GuidFilter } from 'src/query-builder/types/utils/util.types';
import { isCombinedFilter } from './combined-filter-util';

export const toFilterQuery = <T>(
    filters: (QueryFilter<T> | CombinedFilter<T>)[],
): string => {
    if (filters.length === 0) return '';

    return filters.reduce(
        (prev, curr, index) =>
            prev +
            `${index > 0 ? ' and ' : ''}${
                isCombinedFilter<T>(curr)
                    ? getCombinedFilterQuery(curr)
                    : toQueryFilterQuery(curr)
            }`,
        '$filter=',
    );
};

export const getCombinedFilterQuery = <T = string>(
    compositeFilter: CombinedFilter<T>,
) =>
    compositeFilter.filters.length > 0
        ? `(${compositeFilter.filters.reduce(
              (prev, curr, index, array) =>
                  prev +
                  `${toQueryFilterQuery(curr)}${
                      index < array.length - 1
                          ? ` ${compositeFilter.logic} `
                          : ''
                  }`,
              '',
          )})`
        : '';

export const toQueryFilterQuery = <T>(filter: QueryFilter<T>): string => {
    if (
        typeof filter.value === 'string' &&
        ((!isGuidFilter(filter) && !filter.lambdaOperator) ||
            (isGuidFilter(filter) && !filter.removeQuotes))
    ) {
        return getStringFilter(filter, filter.field);
    }

    if (
        !filter.lambdaOperator &&
        ((isGuidFilter(filter) && filter.removeQuotes) ||
            typeof filter.value === 'boolean' ||
            typeof filter.value === 'number' ||
            filter.value instanceof Date)
    ) {
        return `${filter.field} ${filter.operator} ${getFilterValue(filter)}`;
    }

    if (filter.lambdaOperator) {
        return `${filter.field}/${filter.lambdaOperator}(s: ${getStringFilter(
            filter,
            `s${
                (filter.innerField as string)
                    ? `/${filter.innerField as string}`
                    : ''
            }`,
        )})`;
    }
    return '';
};

const isStringFilterFunction = (x: unknown): x is StringFilterOperators => {
    return (
        typeof x === 'string' &&
        (x === 'contains' || x === 'startswith' || x === 'endswith')
    );
};

const hasIgnoreCase = <T>(filter: QueryFilter<T>): boolean => {
    return 'ignoreCase' in filter && filter.ignoreCase;
};

const isGuidFilter = (filter: unknown): filter is GuidFilter => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        (filter as GuidFilter).value,
    );
};
const getStringFilter = <T>(filter: QueryFilter<T>, field: string): string => {
    return isStringFilterFunction(filter.operator)
        ? `${filter.operator}(${
              hasIgnoreCase(filter) ? 'tolower(' : ''
          }${field}${
              hasIgnoreCase(filter) ? ')' : ''
          }, '${filter.value.toString()}')`
        : `${field} ${filter.operator} '${filter.value.toString()}'`;
};
const getFilterValue = <T>(filter: QueryFilter<T>) => {
    if (filter.value instanceof Date) return filter.value.toISOString();

    return filter.value.toString();
};

import { CombinedFilter } from 'src/query-builder/types/filter/combined-filter.type';
import {
    GuidFilter,
    QueryFilter,
    StringFilterOperators,
} from 'src/query-builder/types/filter/query-filter.type';
import { isQueryFilter } from './is-query-filter-util';

export const toFilterQuery = <T>(
    filters: Array<CombinedFilter<T> | QueryFilter<T>>,
): string => {
    return filters.reduce(
        (prev, curr, index) =>
            isQueryFilter(curr)
                ? prev + (index > 0 ? ' and ' : '') + toQueryFilterQuery(curr)
                : '',
        '$filter=',
    );
};

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
            typeof filter.value === 'number')
    ) {
        return `${filter.field} ${filter.operator} ${filter.value}`;
    }

    if (filter.lambdaOperator) {
        console.log(filter);
        return `${filter.field}/${filter.lambdaOperator}(s: ${getStringFilter(
            filter,
            `s${filter.innerField ? '/' + filter.innerField : ''}`,
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
    return 'ignoreCase' in filter && filter.ignoreCase === true;
};

const isGuidFilter = (filter: unknown): filter is GuidFilter => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        (filter as GuidFilter).value,
    );
};
function getStringFilter<T>(filter: QueryFilter<T>, field: string): string {
    return isStringFilterFunction(filter.operator)
        ? `${filter.operator}(${
              hasIgnoreCase(filter) ? 'tolower(' : ''
          }${field}${hasIgnoreCase(filter) ? ')' : ''}, '${filter.value}')`
        : `${field} ${filter.operator} '${filter.value}'`;
}

import { CombinedFilter } from 'src/query-builder/types/filter/combined-filter.type';
import { QueryFilter } from 'src/query-builder/types/filter/query-filter.type';
import { isCombinedFilter } from './combined-filter-util';
import { ODataFilterVisitor } from './filter-visitor';

export const toFilterQuery = <T>(
    filters: Array<QueryFilter<T> | CombinedFilter<T>>,
): string => {
    if (filters.length === 0) return '';

    const visitor = new ODataFilterVisitor<T>();

    return filters.reduce((prev, curr, index) => {
        if (
            !isCombinedFilter(curr) &&
            !isLambdaFilter(curr) &&
            !isBasicFilter(curr)
        ) {
            throw new Error(`Invalid filter: ${JSON.stringify(curr)}`);
        }

        let queryPart: string;
        if (isCombinedFilter(curr)) {
            queryPart = visitor.visitCombinedFilter(curr);
        } else if (isLambdaFilter(curr)) {
            queryPart = visitor.visitLambdaFilter(curr);
        } else {
            queryPart = visitor.visitBasicFilter(curr);
        }

        return prev + (index > 0 ? ' and ' : '') + queryPart;
    }, '$filter=');
};

export function isBasicFilter<T>(obj: unknown): obj is QueryFilter<T> {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'field' in obj &&
        'operator' in obj &&
        'value' in obj &&
        !('lambdaOperator' in obj)
    );
}

export function isLambdaFilter<T>(obj: unknown): obj is QueryFilter<T> {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'field' in obj &&
        'lambdaOperator' in obj &&
        'expression' in obj &&
        (isBasicFilter(obj.expression) ||
            isCombinedFilter(obj.expression) ||
            isLambdaFilter(obj.expression))
    );
}

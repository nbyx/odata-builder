import { SearchTerm } from 'src/query-builder/types/search/search-expression.type';

export function createSearchTerm(term: string): SearchTerm {
    return term as SearchTerm;
}

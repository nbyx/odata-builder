import { SearchTerm } from 'src/query-builder/types/search/search-expression.type';
import { describe, it, expect } from 'vitest';
import { createSearchTerm } from './search.utils';

describe('createSearchTerm', () => {
    it('should return the input string as a SearchTerm', () => {
        const term = 'example';
        const searchTerm = createSearchTerm(term);

        expect(searchTerm).toBe(term);
    });

    it('should ensure the returned value is of type SearchTerm', () => {
        const term = 'example';
        const searchTerm: SearchTerm = createSearchTerm(term);

        expect(searchTerm).toBe(term);
    });

    it('should allow SearchTerm in other contexts', () => {
        const term = createSearchTerm('test');
        const expression: SearchTerm[] = [term];

        expect(expression).toContain('test');
    });
});

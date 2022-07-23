import { describe, expect, it } from 'vitest';
import { toSelectQuery } from './select-utils';

describe('toSelectQuery', () => {
    it('should return the select query string with one select prop', () => {
        const selectProps = ['test'];
        const expectedResult = '$select=test';

        const result = toSelectQuery(selectProps);

        expect(result).toBe(expectedResult);
    });

    it('should return select query with more than one select prop', () => {
        const selectProps = ['test', 'test2', 'test3'];
        const expectedResult = '$select=test, test2, test3';

        const result = toSelectQuery(selectProps);

        expect(result).toBe(expectedResult);
    });
});

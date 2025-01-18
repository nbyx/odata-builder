/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, it } from 'vitest';
import { toExpandQuery } from './expand-util';

describe('expand-util', () => {
    it('should return an expand query part with single expand field', () => {
        const item = {
            x: { someProperty: '' },
        };

        const expectedResult = '$expand=x';

        const result = toExpandQuery<typeof item>(['x']);

        expect(result).toBe(expectedResult);
    });

    it('should return expand query with inner field in navigation property', () => {
        const item = {
            x: { someProperty: { code: 's' } },
        };

        const expectedResult = '$expand=x/someProperty';

        const result = toExpandQuery<typeof item>(['x/someProperty']);

        expect(result).toBe(expectedResult);
    });
});

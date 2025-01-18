import { it, expect } from 'vitest';
import { toTopQuery } from './top-utils';

it('should throw an error for non-integer top count', () => {
    expect(() => toTopQuery(5.5)).toThrowError('Invalid top count');
    expect(() => toTopQuery(NaN)).toThrowError('Invalid top count');
    expect(() => toTopQuery(Infinity)).toThrowError('Invalid top count');
});

it('should handle very large positive top counts', () => {
    const largeTop = Number.MAX_SAFE_INTEGER;
    const expectedQuery = `$top=${largeTop}`;
    const result = toTopQuery(largeTop);
    expect(result).toEqual(expectedQuery);
});

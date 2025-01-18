import { it, expect } from 'vitest';
import { toSkipQuery } from './skip-utils';

it('should throw an error for non-integer skip count', () => {
    expect(() => toSkipQuery(5.5)).toThrowError('Invalid skip count');
    expect(() => toSkipQuery(NaN)).toThrowError('Invalid skip count');
    expect(() => toSkipQuery(Infinity)).toThrowError('Invalid skip count');
});

it('should handle very large positive skip counts', () => {
    const largeSkip = Number.MAX_SAFE_INTEGER;
    const expectedQuery = `$skip=${largeSkip}`;
    const result = toSkipQuery(largeSkip);
    expect(result).toBe(expectedQuery);
});

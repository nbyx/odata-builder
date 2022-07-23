import { describe, expect, it } from 'vitest';
import { toOrderByQuery } from './orderby-utils';

describe('toOrderByQuery', () => {
    it.each(['asc', 'desc'])(
        'should return one order by prop with correct ordering',
        orderDirection => {
            const orderBys = [
                {
                    field: 'test',
                    orderDirection: orderDirection as 'asc' | 'desc',
                } as const,
            ];
            const expectedResult = `$orderby=test ${orderDirection}`;
            const result = toOrderByQuery(orderBys);

            expect(result).toBe(expectedResult);
        },
    );

    it('should return two order by props with correct ordering', () => {
        const orderBys = [
            { field: 'aIOJd3', orderDirection: 'asc' } as const,
            { field: 'test', orderDirection: 'desc' } as const,
        ];
        const expectedResult = '$orderby=aIOJd3 asc, test desc';

        const result = toOrderByQuery(orderBys);

        expect(result).toBe(expectedResult);
    });
});

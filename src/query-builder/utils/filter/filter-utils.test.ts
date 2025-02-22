/* eslint-disable @typescript-eslint/no-unused-vars */
import { CombinedFilter } from 'src/query-builder/types/filter/combined-filter.type';
import { QueryFilter } from 'src/query-builder/types/filter/query-filter.type';
import { Guid } from 'src/query-builder/types/utils/util.types';
import { describe, expect, it } from 'vitest';
import { toFilterQuery, toQueryFilterQuery } from './filter-utils';

describe('toQueryFilterQuery', () => {
    it('should not add quotes to guid filter if removeQuotes is true', () => {
        const item = {
            x: '271242cc-9290-4492-9f23-f340782cd26b' as Guid,
        };
        const expectedResult = 'x eq 271242cc-9290-4492-9f23-f340782cd26b';

        const filter: QueryFilter<typeof item> = {
            field: 'x',
            operator: 'eq',
            value: '271242cc-9290-4492-9f23-f340782cd26b' as Guid,
            removeQuotes: true,
        };

        const result = toQueryFilterQuery(filter);

        expect(result).toBe(expectedResult);
    });

    it('should not have quotes for boolean type', () => {
        const item = {
            x: true,
        };
        const filter: QueryFilter<typeof item> = {
            field: 'x',
            operator: 'eq',
            value: true,
        };
        const expectedResult = 'x eq true';

        const result = toQueryFilterQuery<typeof item>(filter);

        expect(result).toBe(expectedResult);
    });

    it('should not have quotes for number type', () => {
        const item = {
            x: 5,
        };
        const expectedResult = 'x eq 5';
        const filter: QueryFilter<typeof item> = {
            field: 'x',
            operator: 'eq',
            value: 5,
        };

        const result = toQueryFilterQuery(filter);

        expect(result).toBe(expectedResult);
    });

    it('should return empty string if not filter type', () => {
        const result = toQueryFilterQuery({} as QueryFilter<unknown>);

        expect(result).toBe('');
    });

    it('should return filter string with any-lambda', () => {
        const item = {
            x: [{ y: '' }],
        };
        const expectedResult = "x/any(s: contains(tolower(s/y), ''))";

        const filter: QueryFilter<typeof item> = {
            field: 'x',
            operator: 'contains',
            value: '',
            lambdaOperator: 'any',
            ignoreCase: true,
            innerField: 'y',
        };

        const result = toQueryFilterQuery<typeof item>(filter);

        expect(result).toBe(expectedResult);
    });

    it('should return string filter with object in item that is optional', () => {
        const item: { x: { y?: string; t: string } } = {
            x: {
                y: '',
                t: '',
            },
        };
        const expectedResult = "contains(tolower(x/y), '')";

        const filter: QueryFilter<typeof item> = {
            field: 'x/y',
            operator: 'contains',
            value: '',
            ignoreCase: true,
        };

        const result = toQueryFilterQuery<typeof item>(filter);

        expect(result).toBe(expectedResult);
    });

    it('should return filter string with all-lamda for string array', () => {
        const item = {
            x: [''],
        };
        const expectedResult = "x/any(s: contains(tolower(s), ''))";

        const filter: QueryFilter<typeof item> = {
            field: 'x',
            operator: 'contains',
            value: '',
            lambdaOperator: 'any',
            ignoreCase: true,
        };

        const result = toQueryFilterQuery<typeof item>(filter);

        expect(result).toBe(expectedResult);
    });

    it('should return combined filter string with logic or', () => {
        const filter: CombinedFilter<{ x: boolean }> = {
            logic: 'or',
            filters: [
                { field: 'x', operator: 'eq', value: true },
                { field: 'x', operator: 'eq', value: false },
            ],
        };

        const expectedResult = '$filter=(x eq true or x eq false)';

        const result = toFilterQuery<{ x: boolean }>([filter]);

        expect(result).toBe(expectedResult);
    });

    it('should return combined filters string with logic or with filter array', () => {
        const filter1: CombinedFilter<{ x: boolean }> = {
            logic: 'or',
            filters: [
                { field: 'x', operator: 'eq', value: true },
                { field: 'x', operator: 'eq', value: false },
            ],
        };

        const filter2: CombinedFilter<{ x: boolean }> = {
            logic: 'and',
            filters: [
                { field: 'x', operator: 'eq', value: true },
                { field: 'x', operator: 'eq', value: false },
            ],
        };

        const expectedResult =
            '$filter=(x eq true or x eq false) and (x eq true and x eq false)';

        const result = toFilterQuery<{ x: boolean }>([filter1, filter2]);

        expect(result).toBe(expectedResult);
    });

    it('should return combined filters string with date values', () => {
        const date = new Date(Date.now());
        const expectedResult = `$filter=(x eq ${date.toISOString()} or x eq ${date.toISOString()})`;

        const filter: CombinedFilter<{ x: Date }> = {
            logic: 'or',
            filters: [
                { field: 'x', operator: 'eq', value: date },
                { field: 'x', operator: 'eq', value: date },
            ],
        };

        const result = toFilterQuery<{ x: Date }>([filter]);

        expect(result).toBe(expectedResult);
    });

    it('should return combined filters with another combined filter in it', () => {
        const expectedResult = `$filter=((x eq 'test' or x eq 'test1') and (y eq 'test2' or y eq 'test3') and z eq 'test4')`;

        interface dto {
            x: string;
            y: string;
            z: string;
        }

        const filters: CombinedFilter<dto> = {
            logic: 'and',
            filters: [
                {
                    logic: 'or',
                    filters: [
                        { field: 'x', operator: 'eq', value: 'test' },
                        { field: 'x', operator: 'eq', value: 'test1' },
                    ],
                },
                {
                    logic: 'or',
                    filters: [
                        { field: 'y', operator: 'eq', value: 'test2' },
                        { field: 'y', operator: 'eq', value: 'test3' },
                    ],
                },
                { field: 'z', operator: 'eq', value: 'test4' },
            ],
        };

        const result = toFilterQuery<dto>([filters]);

        expect(result).toBe(expectedResult);
    });

    it('should return string wieh null value for combined filter', () => {
        const expectedResult = '$filter=(x eq null)';

        const filter: CombinedFilter<{ x: null }> = {
            logic: 'or',
            filters: [{ field: 'x', operator: 'eq', value: null }],
        };

        const result = toFilterQuery<{ x: null }>([filter]);

        expect(result).toBe(expectedResult);
    });

    it('should return string with null value for query filter', () => {
        const expectedResult = 'x eq null';

        const filter: QueryFilter<{ x: null }> = {
            field: 'x',
            operator: 'eq',
            value: null,
        };

        const result = toQueryFilterQuery<{ x: null }>(filter);

        expect(result).toBe(expectedResult);
    });

    it('should return empty string for toFilterQuery with empty array', () => {
        const result = toFilterQuery<{ x: boolean }>([]);
        expect(result).toEqual('');
    });
});

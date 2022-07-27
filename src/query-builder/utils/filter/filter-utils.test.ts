import { QueryFilter } from 'src/query-builder/types/filter/query-filter.type';
import { Guid } from 'src/query-builder/types/utils/util.types';
import { describe, expect, it } from 'vitest';
import { toQueryFilterQuery } from './filter-utils';

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

        const filter = {
            field: 'x',
            operator: 'contains',
            value: '',
            lambdaOperator: 'any',
            ignoreCase: true,
            innerField: 'y',
        } as const;

        const result = toQueryFilterQuery<typeof item>(filter);

        expect(result).toBe(expectedResult);
    });

    it('should return filter string with all-lamda for string array', () => {
        const item = {
            x: [''],
        };
        const expectedResult = "x/any(s: contains(tolower(s), ''))";

        const filter = {
            field: 'x',
            operator: 'contains',
            value: '',
            lambdaOperator: 'any',
            ignoreCase: true,
        } as const;

        const result = toQueryFilterQuery<typeof item>(filter);

        expect(result).toBe(expectedResult);
    });
});

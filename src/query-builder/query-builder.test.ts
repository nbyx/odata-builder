import { expect, describe, it } from 'vitest';
import { OdataQueryBuilder } from '.';
import {
    FilterFields,
    FilterOperators,
} from './types/filter/query-filter.type';
import { Guid } from './types/utils/util.types';

describe('query-builder', () => {
    it('should return an empty string if toQuery is called without function', () => {
        const queryBuilder = new OdataQueryBuilder();

        expect(queryBuilder.toQuery()).toBe('');
    });

    it('should add top to the query', () => {
        const expectedTop = 100;
        const expectedQuery = `?$top=${expectedTop}`;

        const queryBuilder = new OdataQueryBuilder();
        queryBuilder.top(expectedTop);

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add skip to the query', () => {
        const expectedSkip = 10;
        const expectedQuery = `?$skip=${expectedSkip}`;

        const queryBuilder = new OdataQueryBuilder();
        queryBuilder.skip(expectedSkip);

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should only add one skip', () => {
        const expectedSkip = 10;
        const expectedQuery = `?$skip=${expectedSkip}`;

        const queryBuilder = new OdataQueryBuilder();
        queryBuilder.skip(expectedSkip).skip(1000).skip(5);

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should begin with count when choosing count entities', () => {
        const expectedQuery = '/$count';

        const queryBuilder = new OdataQueryBuilder();
        queryBuilder.count(true);

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add the count operator to the query', () => {
        const expectedQuery = '?$count=true';

        const queryBuilder = new OdataQueryBuilder();
        queryBuilder.count();

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should only add the first count', () => {
        const expectedQuery = '?$count=true';

        const queryBuilder = new OdataQueryBuilder();
        queryBuilder.count().count().count();

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add select to the query', () => {
        const item = {
            x: 6,
            y: 4,
        };
        const expectedQuery = '?$select=x, y';

        const queryBuilder = new OdataQueryBuilder<typeof item>();
        queryBuilder.select('x', 'y');

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add one select if select is called multiple times', () => {
        const item = {
            x: 6,
            y: 4,
        };
        const expectedQuery = '?$select=x, y';

        const queryBuilder = new OdataQueryBuilder<typeof item>();
        queryBuilder.select('x').select('y');

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add orderby to the query', () => {
        const item = {
            a: 1,
            b: 2,
        };

        const expectedQuery = '?$orderby=a desc';

        const queryBuilder = new OdataQueryBuilder<typeof item>();
        queryBuilder.orderBy({ field: 'a', orderDirection: 'desc' });

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add a number filter to the query', () => {
        const item = {
            x: 1,
        };

        const expectedQuery = '?$filter=x eq 1';

        const queryBuilder = new OdataQueryBuilder<typeof item>();
        queryBuilder.filter({ field: 'x', operator: 'eq', value: 1 });

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it.each([
        { operator: 'eq', ignoreCase: true } as const,
        { operator: 'eq', ignoreCase: false } as const,
        { operator: 'contains', ignoreCase: true } as const,
        { operator: 'contains', ignoreCase: false } as const,
    ])('should add a string filter to the query', filterOption => {
        const item = {
            x: '1',
        };

        const filter = {
            field: 'x',
            value: '1',
            operator: filterOption.operator,
            ignoreCase: filterOption.ignoreCase,
        } as const;

        const expectedQuery =
            '?$filter=' +
            (filterOption.operator === 'contains'
                ? `contains(${filterOption.ignoreCase ? 'tolower(' : ''}${
                      filter.field
                  }${filterOption.ignoreCase ? ')' : ''}, '${filter.value}')`
                : `${filter.field} ${filter.operator} '${filter.value}'`);

        const queryBuilder = new OdataQueryBuilder<typeof item>();
        queryBuilder.filter(filter);

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add space before and when combining two filters', () => {
        interface MyAwesomeDto {
            y: string;
            x: Guid;
        }
        const expectedResult = `?$filter=x eq 76b44f03-bb98-48eb-81fd-63007465a76d and y eq ''`;
        const filter = {
            field: 'x',
            operator: 'eq',
            value: '76b44f03-bb98-48eb-81fd-63007465a76d' as Guid,
            removeQuotes: true,
        } as const;

        const query = new OdataQueryBuilder<MyAwesomeDto>()
            .filter(filter)
            .filter({ field: 'y', operator: 'eq', value: '' })
            .toQuery();

        expect(query).toBe(expectedResult);
    });

    it('should add the filter with lambda combined with non lambda filter', () => {
        const queryBuilder = new OdataQueryBuilder<typeof item>();
        const item = {
            x: [{ y: '' }],
            z: false,
        };
        const expectedResult = `?$filter=x/any(s: contains(s/y, '1')) and z eq false`;

        const filter = {
            field: 'x',
            operator: 'contains',
            value: '1',
            lambdaOperator: 'any',
            innerField: 'y',
        } as const;

        queryBuilder
            .filter(filter)
            .filter({ field: 'z', operator: 'eq', value: false });

        expect(queryBuilder.toQuery()).toBe(expectedResult);
    });

    it('should combine the filters regardless of order', () => {
        const item = {
            w: { someProperty: '' },
            x: 't',
            y: 4,
            z: 'test' as Guid,
        };
        const expectedQuery =
            "?$count=true&$filter=z eq '76b44f03-bb98-48eb-81fd-63007465a76d' and (x eq 'test' or y eq 5)&$top=100&$skip=10&$select=x&$expand=w&$orderby=x asc";
        const queryBuilder = new OdataQueryBuilder<typeof item>();

        queryBuilder
            .skip(10)
            .orderBy({ field: 'x', orderDirection: 'asc' })
            .count()
            .top(100)
            .filter({
                field: 'z',
                operator: 'eq',
                value: '76b44f03-bb98-48eb-81fd-63007465a76d' as Guid,
            })
            .filter({
                logic: 'or',
                filters: [
                    { field: 'x', operator: 'eq', value: 'test' },
                    { field: 'y', operator: 'eq', value: 5 },
                ],
            })
            .expand('w')
            .select('x');

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should return a filter string with computed values for filter', () => {
        const item = {
            x: 4,
            y: 'test',
            z: new Date(Date.now()),
        };
        const expectedQuery = "?$filter=y eq '4'";

        const testFn = (
            field: FilterFields<typeof item, string>,
            operator: FilterOperators<string>,
            value: string,
        ): string => {
            const queryBuilder = new OdataQueryBuilder<typeof item>();

            queryBuilder.filter({ field, operator, value });

            return queryBuilder.toQuery();
        };

        const result = testFn('y', 'eq', '4');

        expect(result).toBe(expectedQuery);
    });
});

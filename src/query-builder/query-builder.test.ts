import { expect, describe, it } from 'vitest';
import { OdataQueryBuilder } from '.';

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
            filterOption.operator === 'contains'
                ? `contains(${filterOption.ignoreCase ? 'tolower(' : ''}${
                      filter.field
                  }${filterOption.ignoreCase ? ')' : ''}, '${filter.value}')`
                : `${filter.field} ${filter.operator} ${filter.value}`;

        const queryBuilder = new OdataQueryBuilder<typeof item>();
        queryBuilder.filter(filter);

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should combine the filters regardless of order', () => {
        const item = {
            x: 't',
            y: 4,
        };
        const expectedQuery =
            '?$count=true&$top=100&$skip=10&$select=x&$orderby=x asc';
        const queryBuilder = new OdataQueryBuilder<typeof item>();

        queryBuilder
            .skip(10)
            .orderBy({ field: 'x', orderDirection: 'asc' })
            .count()
            .top(100)
            .select('x');

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });
});

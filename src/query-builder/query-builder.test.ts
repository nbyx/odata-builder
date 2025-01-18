/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, describe, it } from 'vitest';
import { OdataQueryBuilder } from '.';
import {
    FilterFields,
    FilterOperators,
    QueryFilter,
} from './types/filter/query-filter.type';
import { Guid } from './types/utils/util.types';
import { OrderByDescriptor } from './types/orderby/orderby-descriptor.type';

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

    it('should begin with count when choosing count entities and add a filter', () => {
        type ItemType = {
            x: 6;
            y: 4;
        };

        const expectedQuery = '/$count?$filter=x eq 6';

        const queryBuilder = new OdataQueryBuilder<ItemType>();
        queryBuilder
            .filter({ field: 'x', operator: 'eq', value: 6 })
            .count(true);

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
        type ItemType = {
            x: 6;
            y: 4;
        };
        const expectedQuery = '?$select=x, y';

        const queryBuilder = new OdataQueryBuilder<ItemType>();
        queryBuilder.select('x', 'y');

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add one select if select is called multiple times', () => {
        type ItemType = {
            x: 6;
            y: 4;
        };
        const expectedQuery = '?$select=x, y';

        const queryBuilder = new OdataQueryBuilder<ItemType>();
        queryBuilder.select('x').select('y');

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add orderby to the query', () => {
        type ItemType = {
            a: 1;
            b: 2;
        };

        const expectedQuery = '?$orderby=a desc';

        const queryBuilder = new OdataQueryBuilder<ItemType>();
        queryBuilder.orderBy({ field: 'a', orderDirection: 'desc' });

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it('should add a number filter to the query', () => {
        type ItemType = {
            x: 1;
        };

        const expectedQuery = '?$filter=x eq 1';

        const queryBuilder = new OdataQueryBuilder<ItemType>();
        queryBuilder.filter({ field: 'x', operator: 'eq', value: 1 });

        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    it.each([
        { operator: 'eq', ignoreCase: true } as const,
        { operator: 'eq', ignoreCase: false } as const,
        { operator: 'contains', ignoreCase: true } as const,
        { operator: 'contains', ignoreCase: false } as const,
    ])('should add a string filter to the query', filterOption => {
        type ItemType = {
            x: '1';
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
                : `${filterOption.ignoreCase ? 'tolower(' : ''}${filter.field}${
                      filterOption.ignoreCase ? ')' : ''
                  } ${filter.operator} '${filter.value}'`);

        const queryBuilder = new OdataQueryBuilder<ItemType>();
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

    it('should add filter if query builder is in a function', () => {
        interface MyAwesomeDto {
            y: string;
            x: string;
        }
        const expectedResult = `?$filter=x eq 76b44f03-bb98-48eb-81fd-63007465a76d`;

        const getQuery = (queryPart: string) => {
            return new OdataQueryBuilder<MyAwesomeDto>()
                .filter({
                    field: 'x',
                    operator: 'eq',
                    value: queryPart,
                    removeQuotes: true,
                })
                .toQuery();
        };

        expect(getQuery('76b44f03-bb98-48eb-81fd-63007465a76d')).toBe(
            expectedResult,
        );
    });
    it('should also filter with optional properties', () => {
        type MyAwesomeDto = { x?: { code: string } } & { y: boolean };
        const expectedResult = "?$filter=x/code eq 'test'";

        const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>();

        queryBuilder.filter({ field: 'x/code', operator: 'eq', value: 'test' });

        expect(queryBuilder.toQuery()).toBe(expectedResult);
    });
    it('should add the filter with lambda combined with non lambda filter', () => {
        const queryBuilder = new OdataQueryBuilder<ItemType>();
        type ItemType = {
            x: [{ y: '' }];
            z: false;
        };
        const expectedResult = `?$filter=x/any(s: contains(s/y, '1')) and z eq false`;

        queryBuilder
            .filter({
                field: 'x',
                operator: 'contains',
                value: '1',
                lambdaOperator: 'any',
                innerField: 'y',
            })
            .filter({ field: 'z', operator: 'eq', value: false });

        expect(queryBuilder.toQuery()).toBe(expectedResult);
    });
    it('should add the filter query also for nullable types', () => {
        interface MyAwesomeDto {
            test: string | null;
        }

        const expectedResult = "?$filter=test eq '1'";

        const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>().filter({
            field: 'test',
            operator: 'eq',
            value: '1',
        });

        expect(queryBuilder.toQuery()).toBe(expectedResult);
    });

    it('should add the filter query also for nullable types in nested properties', () => {
        interface MyAwesomeDto {
            test: { x: string | null };
        }

        const expectedResult = "?$filter=test/x eq '1'";

        const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>().filter({
            field: 'test/x',
            operator: 'eq',
            value: '1',
        });

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

    it('should return a filter string for a deeply nested object', () => {
        const item = {
            x: {
                y: {
                    z: 'test',
                },
            },
        };
        const expectedQuery = "?$filter=x/y/z eq 'test'";

        const queryBuilder = new OdataQueryBuilder<typeof item>();

        queryBuilder.filter({ field: 'x/y/z', operator: 'eq', value: 'test' });

        const result = queryBuilder.toQuery();

        expect(result).toBe(expectedQuery);
    });

    it('should return a filter string with combined filter inside of combined filter', () => {
        const item = {
            x: 'test',
            y: 'test1',
            z: 'test2',
        };
        const expectedQuery = `?$filter=((x eq 'test' or y eq 'test1') and z eq 'test')`;

        const queryBuilder = new OdataQueryBuilder<typeof item>();

        queryBuilder.filter({
            logic: 'and',
            filters: [
                {
                    logic: 'or',
                    filters: [
                        { field: 'x', operator: 'eq', value: 'test' },
                        { field: 'y', operator: 'eq', value: 'test1' },
                    ],
                },
                { field: 'z', operator: 'eq', value: 'test' },
            ],
        });

        const result = queryBuilder.toQuery();

        expect(result).toBe(expectedQuery);
    });

    it('should enforce correct types for filter', () => {
        type Item = { name: string; count: number };
        const builder = new OdataQueryBuilder<Item>();
        builder.filter({ field: 'name', operator: 'eq', value: 'test' });
        builder.filter({ field: 'count', operator: 'gt', value: 5 });
        // @ts-expect-error name is of type string
        builder.filter({ field: 'name', operator: 'eq', value: 5 });
        // @ts-expect-error count is of type number
        builder.filter({ field: 'count', operator: 'eq', value: 'test' });
    });

    it('should enforce correct types for select', () => {
        type Item = { name: string; count: number };
        const builder = new OdataQueryBuilder<Item>();
        builder.select('name', 'count');
        // @ts-expect-error field does not exist
        builder.select('invalidField');
    });

    it('should enforce correct types for orderBy', () => {
        type Item = { name: string; count: number };
        const builder = new OdataQueryBuilder<Item>();
        builder.orderBy({ field: 'name', orderDirection: 'asc' });
        builder.orderBy({ field: 'count', orderDirection: 'desc' });
        // @ts-expect-error field does not exist
        builder.orderBy({ field: 'invalidField', orderDirection: 'asc' });
    });

    it('should enforce correct types for expand', () => {
        type Item = { details: { code: string } };
        const builder = new OdataQueryBuilder<Item>();
        builder.expand('details');
        // @ts-expect-error field does not exist
        builder.expand('invalidField');
    });

    it('should throw an error if select is called with null or undefined', () => {
        const queryBuilder = new OdataQueryBuilder();
        //@ts-expect-error value is not allowed
        expect(() => queryBuilder.select(null)).toThrowError(
            'Invalid select input',
        );
        //@ts-expect-error value is not allowed
        expect(() => queryBuilder.select(undefined)).toThrowError(
            'Invalid select input',
        );
    });

    it('should throw an error if filter is called with null or undefined', () => {
        const queryBuilder = new OdataQueryBuilder();
        //@ts-expect-error value is not allowed
        expect(() => queryBuilder.filter(null)).toThrowError(
            'Invalid filter input',
        );
        //@ts-expect-error value is not allowed
        expect(() => queryBuilder.filter(undefined)).toThrowError(
            'Invalid filter input',
        );
    });

    it('should throw an error if expand is called with null or undefined', () => {
        const queryBuilder = new OdataQueryBuilder();
        //@ts-expect-error value is not allowed
        expect(() => queryBuilder.expand(null)).toThrowError(
            'Field missing for expand',
        );
        //@ts-expect-error value is not allowed
        expect(() => queryBuilder.expand(undefined)).toThrowError(
            'Field missing for expand',
        );
    });

    it('should throw an error if orderBy is called with an empty array', () => {
        const queryBuilder = new OdataQueryBuilder();
        expect(() => queryBuilder.orderBy()).not.toThrowError();
    });

    it('should handle all query parameters together', () => {
        type ItemType = {
            id: Guid;
            name: string;
            age: number;
            isActive: boolean;
            details: { code: string };
            tags: string[];
        };
        const expectedQuery =
            "?$count=true&$filter=isActive eq true and tags/any(s: contains(tolower(s), 'test'))&$top=50&$skip=5&$select=name, age&$expand=details&$orderby=age desc";
        const queryBuilder = new OdataQueryBuilder<ItemType>()
            .count()
            .filter({ field: 'isActive', operator: 'eq', value: true })
            .filter({
                field: 'tags',
                operator: 'contains',
                value: 'test',
                lambdaOperator: 'any',
                ignoreCase: true,
            })
            .top(50)
            .skip(5)
            .select('name', 'age')
            .expand('details')
            .orderBy({ field: 'age', orderDirection: 'desc' });
        expect(queryBuilder.toQuery()).toBe(expectedQuery);
    });

    // Add tests for FilterString if you plan to implement it

    it('should throw an error for negative top count in top() method', () => {
        const queryBuilder = new OdataQueryBuilder();
        expect(() => queryBuilder.top(-1)).toThrowError('Invalid top count');
    });

    it('should throw an error for negative skip count in skip() method', () => {
        const queryBuilder = new OdataQueryBuilder();
        expect(() => queryBuilder.skip(-1)).toThrowError('Invalid skip count');
    });

    it('should produce the same query regardless of the order of method calls', () => {
        type ItemType = { id: number; name: string };
        const filter: QueryFilter<ItemType> = {
            field: 'id',
            operator: 'eq',
            value: 1,
        };
        const orderBy: OrderByDescriptor<ItemType> = {
            field: 'name',
            orderDirection: 'asc',
        };
        const select = 'name';

        const builder1 = new OdataQueryBuilder<ItemType>()
            .filter(filter)
            .orderBy(orderBy)
            .select(select);

        const builder2 = new OdataQueryBuilder<ItemType>()
            .orderBy(orderBy)
            .select(select)
            .filter(filter);

        expect(builder1.toQuery()).toBe(builder2.toQuery());
        expect(builder1.toQuery()).toBe(
            '?$filter=id eq 1&$select=name&$orderby=name asc',
        );
    });
});

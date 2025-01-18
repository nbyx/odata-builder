import { describe, it, assertType, expectTypeOf } from 'vitest';
import {
    QueryFilter,
    FilterFields,
    LambdaFilterFields,
    FilterOperators,
} from './query-filter.type';
import { Guid } from '../utils/util.types';

describe('QueryFilter<T>', () => {
    it('should allow boolean filter', () => {
        type Item = { isActive: boolean };
        const filter: QueryFilter<Item> = {
            field: 'isActive',
            operator: 'eq',
            value: true,
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow string filter', () => {
        type Item = { name: string };
        const filter: QueryFilter<Item> = {
            field: 'name',
            operator: 'contains',
            value: 'test',
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow date filter', () => {
        type Item = { createdDate: Date };
        const filter: QueryFilter<Item> = {
            field: 'createdDate',
            operator: 'gt',
            value: new Date(),
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow guid filter', () => {
        type Item = { id: Guid };
        const filter: QueryFilter<Item> = {
            field: 'id',
            operator: 'eq',
            value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' as Guid,
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow number filter', () => {
        type Item = { count: number };
        const filter: QueryFilter<Item> = {
            field: 'count',
            operator: 'lt',
            value: 10,
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow nested field filter', () => {
        type Item = { details: { code: string } };
        const filter: QueryFilter<Item> = {
            field: 'details/code',
            operator: 'eq',
            value: 'test',
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow lambda operator on array of primitives', () => {
        type Item = { tags: string[] };
        const filter: QueryFilter<Item> = {
            field: 'tags',
            operator: 'contains',
            value: 'test',
            lambdaOperator: 'any',
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow lambda operator with inner field on array of objects', () => {
        type Item = { items: { name: string }[] };
        const filter: QueryFilter<Item> = {
            field: 'items',
            operator: 'contains',
            value: 'test',
            lambdaOperator: 'any',
            innerField: 'name',
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow null value for string filter', () => {
        type Item = { name: string | null };
        const filter: QueryFilter<Item> = {
            field: 'name',
            operator: 'eq',
            value: null,
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should allow null value for number filter', () => {
        type Item = { count: number | null };
        const filter: QueryFilter<Item> = {
            field: 'count',
            operator: 'eq',
            value: null,
        };
        assertType<QueryFilter<Item>>(filter);
    });

    it('should only allow ignoreCase for string fields', () => {
        type Item = { name: string; count: number };
        const stringFilter: QueryFilter<Item> = {
            field: 'name',
            operator: 'contains',
            value: 'test',
            ignoreCase: true,
        };
        assertType<QueryFilter<Item>>(stringFilter);

        const numberFilter: QueryFilter<Item> = {
            field: 'count',
            operator: 'eq',
            value: 5,
            // @ts-expect-error - ignoreCase is not allowed for number fields
            ignoreCase: true,
        };
        void numberFilter;
    });

    it('should only allow removeQuotes for string and Guid fields', () => {
        type Item = { id: Guid; name: string; count: number };
        const guidFilter: QueryFilter<Item> = {
            field: 'id',
            operator: 'eq',
            value: '...' as Guid,
            removeQuotes: true,
        };
        assertType<QueryFilter<Item>>(guidFilter);
        const stringFilter: QueryFilter<Item> = {
            field: 'name',
            operator: 'eq',
            value: 'test',
            removeQuotes: true,
        };
        assertType<QueryFilter<Item>>(stringFilter);

        const numberFilter: QueryFilter<Item> = {
            field: 'count',
            operator: 'eq',
            value: 5,
            //@ts-expect-error should not be allowed for number
            removeQuotes: true,
        };
        void numberFilter;
    });

    it('should allow filter on optional property', () => {
        type Item = { name?: string };
        const filter: QueryFilter<Item> = {
            field: 'name',
            operator: 'eq',
            value: 'test',
        };
        assertType<QueryFilter<Item>>(filter);
    });
});

describe('FilterFields<T, VALUETYPE>', () => {
    it('should allow fields with matching value type', () => {
        type Item = { name: string; count: number };
        expectTypeOf<FilterFields<Item, string>>().toEqualTypeOf<'name'>();
    });

    it('should allow nested fields with matching value type', () => {
        type Item = { details: { code: string } };
        expectTypeOf<
            FilterFields<Item, string>
        >().toEqualTypeOf<'details/code'>();
    });

    it('should allow fields in array of primitives with matching value type', () => {
        type Item = { tags: string[] };
        expectTypeOf<FilterFields<Item, string>>().toEqualTypeOf<'tags'>();
    });

    it('should allow fields in array of objects with matching value type', () => {
        type Item = { items: { name: string }[] };
        expectTypeOf<FilterFields<Item, string>>().toEqualTypeOf<'items'>();
    });

    it('should not allow fields with non-matching value type', () => {
        type Item = { name: string; count: number };
        expectTypeOf<FilterFields<Item, number>>().not.toEqualTypeOf<'name'>();
    });

    it('should allow fields with matching value type (nullable)', () => {
        type Item = { name: string | null; count: number };
        expectTypeOf<FilterFields<Item, string>>().toEqualTypeOf<'name'>();
    });

    it('should allow nested fields with matching value type (complex)', () => {
        type Item = { details: { address: { street: string } } };
        expectTypeOf<
            FilterFields<Item, string>
        >().toEqualTypeOf<'details/address/street'>();
    });

    it('should not allow fields with non-matching value type (complex)', () => {
        type Item = { details: { code: string; value: number } };
        expectTypeOf<
            FilterFields<Item, number>
        >().not.toEqualTypeOf<'details/code'>();
    });

    it('should not allow innerField for primitive array', () => {
        type Item = { tags: string[] };
        const filter: QueryFilter<Item> = {
            field: 'tags',
            operator: 'contains',
            value: 'test',
            lambdaOperator: 'any',
            // @ts-expect-error - innerField is not allowed for primitive arrays
            innerField: 'invalid',
        };
        void filter;
    });

    it('should not allow filtering on object fields directly', () => {
        type Item = { details: { code: string } };
        const filter: QueryFilter<Item> = {
            // @ts-expect-error - Cannot filter on object field directly without nested property
            field: 'details',
            operator: 'eq',
            // @ts-expect-error - Cannot filter on object field directly without nested property
            value: { code: 'test' },
        };
        void filter;
    });

    it('should not allow ignoreCase for boolean fields', () => {
        type Item = { isActive: boolean };
        const filter: QueryFilter<Item> = {
            field: 'isActive',
            operator: 'eq',
            value: true,
            // @ts-expect-error - ignoreCase is not allowed for boolean fields
            ignoreCase: true,
        };
        void filter;
    });

    it('should not allow removeQuotes for boolean fields', () => {
        type Item = { isActive: boolean };
        const filter: QueryFilter<Item> = {
            field: 'isActive',
            operator: 'eq',
            value: true,
            // @ts-expect-error - removeQuotes is not allowed for boolean fields
            removeQuotes: true,
        };
        void filter;
    });
});

describe('LambdaFilterFields<T, VALUETYPE>', () => {
    it('should allow fields of array of objects', () => {
        type Item = { items: { name: string; value: number }[] };
        expectTypeOf<
            LambdaFilterFields<Item, string>
        >().toEqualTypeOf<'name'>();
    });

    it('should not allow fields of primitive types', () => {
        type Item = { tags: string[] };
        expectTypeOf<LambdaFilterFields<Item, string>>().toEqualTypeOf<never>();
    });
});

describe('FilterOperators<VALUETYPE>', () => {
    it('should allow string operators for string values', () => {
        expectTypeOf<FilterOperators<string>>().toEqualTypeOf<
            'eq' | 'ne' | 'contains' | 'startswith' | 'endswith'
        >();
    });

    it('should allow number operators for number values', () => {
        expectTypeOf<FilterOperators<number>>().toEqualTypeOf<
            'eq' | 'ne' | 'ge' | 'gt' | 'le' | 'lt'
        >();
    });

    it('should allow date operators for date values', () => {
        expectTypeOf<FilterOperators<Date>>().toEqualTypeOf<
            'eq' | 'ne' | 'ge' | 'gt' | 'le' | 'lt'
        >();
    });

    it('should allow fields of array of objects with different value types', () => {
        type Item = {
            items: { name: string; value: number; isActive: boolean }[];
        };
        expectTypeOf<
            LambdaFilterFields<Item, string>
        >().toEqualTypeOf<'name'>();
        expectTypeOf<
            LambdaFilterFields<Item, number>
        >().toEqualTypeOf<'value'>();
        expectTypeOf<
            LambdaFilterFields<Item, boolean>
        >().toEqualTypeOf<'isActive'>();
    });

    it('should not allow fields of non-array types', () => {
        type Item = { name: string };
        expectTypeOf<LambdaFilterFields<Item, string>>().toEqualTypeOf<never>();
    });
});

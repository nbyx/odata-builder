import { describe, it, assertType, expectTypeOf } from 'vitest';
import { OrderByDescriptor, OrderByFields } from './orderby-descriptor.type';

describe('OrderByDescriptor<T>', () => {
    it('should allow ordering by valid fields', () => {
        type Item = { name: string; count: number };
        const orderBy: OrderByDescriptor<Item> = {
            field: 'name',
            orderDirection: 'asc',
        };
        assertType<OrderByDescriptor<Item>>(orderBy);
    });

    it('should allow ordering by nested valid fields', () => {
        type Item = { details: { code: string } };
        const orderBy: OrderByDescriptor<Item> = {
            field: 'details/code',
            orderDirection: 'desc',
        };
        assertType<OrderByDescriptor<Item>>(orderBy);
    });

    it('should not allow ordering by invalid fields', () => {
        type Item = { name: string };

        const orderBy: OrderByDescriptor<Item> = {
            // @ts-expect-error: 'invalidField' is not a valid key of Item
            field: 'invalidField',
            orderDirection: 'asc',
        };

        void orderBy;
    });

    it('should allow ordering by multiple nested valid fields', () => {
        type Item = {
            details: { code: string; value: number };
            address: { city: string; zip: number };
        };
        expectTypeOf<OrderByFields<Item>>().toEqualTypeOf<
            | 'details/code'
            | 'details/value'
            | 'details'
            | 'address/city'
            | 'address/zip'
            | 'address'
        >();
    });

    it('should allow ordering by deeply nested valid fields', () => {
        type Item = { details: { address: { street: string } } };
        const orderBy: OrderByDescriptor<Item> = {
            field: 'details/address/street',
            orderDirection: 'asc',
        };
        assertType<OrderByDescriptor<Item>>(orderBy);
    });

    it('should not allow ordering by non-existent deeply nested fields', () => {
        type Item = { details: { address: { street: string } } };
        const orderBy: OrderByDescriptor<Item> = {
            // @ts-expect-error field is not defined
            field: 'details/address/invalidField',
            orderDirection: 'asc',
        };
        void orderBy;
    });
});

describe('OrderByFields<T>', () => {
    it('should allow top-level orderable fields', () => {
        type Item = { name: string; count: number };
        expectTypeOf<OrderByFields<Item>>().toEqualTypeOf<'name' | 'count'>();
    });

    it('should allow nested orderable fields', () => {
        type Item = { details: { code: string; value: number } };
        expectTypeOf<OrderByFields<Item>>().toEqualTypeOf<
            'details/code' | 'details/value' | 'details'
        >();
    });
});

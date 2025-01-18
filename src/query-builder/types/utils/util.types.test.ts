import { describe, it, assertType } from 'vitest';
import { Guid, QueryComponents } from './util.types';

describe('Guid', () => {
    it('should accept a valid GUID string', () => {
        const _guid: Guid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' as Guid;
        assertType<Guid>(_guid);
    });
});

describe('QueryComponents<T>', () => {
    it('should allow all query components', () => {
        type Item = { name: string; count: number; details: { code: string } };
        const components: QueryComponents<Item> = {
            count: '$count=true',
            filter: new Set([{ field: 'name', operator: 'eq', value: 'test' }]),
            top: 10,
            skip: 5,
            select: new Set(['name']),
            orderBy: new Set([{ field: 'name', orderDirection: 'asc' }]),
            expand: new Set(['details']),
        };
        assertType<QueryComponents<Item>>(components);
    });

    it('should allow a QueryComponents with only some components', () => {
        type Item = { name: string; count: number };
        const components: QueryComponents<Item> = {
            filter: new Set([{ field: 'name', operator: 'eq', value: 'test' }]),
            top: 10,
        };
        assertType<QueryComponents<Item>>(components);
    });

    it('should allow a QueryComponents with empty sets', () => {
        type Item = { name: string; count: number };
        const components: QueryComponents<Item> = {
            filter: new Set(),
            select: new Set(),
            orderBy: new Set(),
            expand: new Set(),
        };
        assertType<QueryComponents<Item>>(components);
    });
});

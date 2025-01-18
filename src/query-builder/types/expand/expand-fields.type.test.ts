import { describe, it, expectTypeOf } from 'vitest';
import { ExpandFields } from './expand-fields.type';

describe('ExpandFields<T>', () => {
    it('should allow top-level expandable fields', () => {
        type Item = {
            navigation: { id: string };
            property: string;
        };
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<'navigation'>();
    });

    it('should allow nested expandable fields', () => {
        type Item = {
            navigation: { nested: { id: string } };
        };
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<
            'navigation/nested' | 'navigation'
        >();
    });

    it('should not allow non-expandable fields', () => {
        type Item = {
            property: string;
        };
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<never>();
    });

    it('should allow only expandable fields when mixed with non-expandable', () => {
        type Item = {
            navigation: { id: string };
            property: string;
            nested: {
                innerNavigation: { name: string };
                innerProperty: number;
            };
        };
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<
            'navigation' | 'nested' | 'nested/innerNavigation'
        >();
    });

    it('should handle multiple levels of nested expandable fields', () => {
        type Item = {
            level1: {
                level2: {
                    level3: { id: string };
                };
            };
        };
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<
            'level1' | 'level1/level2' | 'level1/level2/level3'
        >();
    });

    it('should return never for an empty interface', () => {
        type Item = object;
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<never>();
    });

    it('should handle null navigation properties', () => {
        type Item = {
            navigation: { nested: { id: string } | null };
        };
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<
            'navigation' | 'navigation/nested'
        >();
    });

    it('should handle undefined navigation properties', () => {
        type Item = {
            navigation: { nested?: { id: string } };
        };
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<
            'navigation' | 'navigation/nested'
        >();
    });

    it('should handle a mix of valid and potentially invalid nested paths (type level)', () => {
        type Item = {
            navigation: {
                nested: { id: string };
                invalidNested: string;
            };
        };
        expectTypeOf<ExpandFields<Item>>().toEqualTypeOf<
            'navigation' | 'navigation/nested'
        >();
    });
});

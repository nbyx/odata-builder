import { QueryFilter } from 'src/query-builder/types/filter/query-filter.type';
import { describe, expect, it } from 'vitest';
import { isQueryFilter } from './is-query-filter-util';

describe('isQueryFilter', () => {
    it('should return true', () => {
        const filter: QueryFilter<{ Code: 5 }> = {
            field: 'Code',
            operator: 'eq',
            value: 5,
        };

        expect(isQueryFilter(filter)).toBeTruthy();
    });

    it('should return false', () => {
        const filter = {
            field: 'Code',
        };

        expect(isQueryFilter(filter)).toBeFalsy();
    });

    it('should return true with field boolean', () => {
        const filter: QueryFilter<{ Code: true }> = {
            field: 'Code',
            operator: 'eq',
            value: false,
        };

        expect(isQueryFilter(filter)).toBeTruthy();
    });
});

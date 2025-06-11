import { describe, it, expect } from 'vitest';
import { getValueType, isGuid, isValidOperator, isValidTransform } from './filter-helper.util';

describe('filter-helper.util', () => {
    describe('isGuid', () => {
        it('should accept valid GUID v1 format', () => {
            expect(isGuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
            expect(isGuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
        });

        it('should accept valid GUID v2 format', () => {
            expect(isGuid('6ba7b812-9dad-21d1-80b4-00c04fd430c8')).toBe(true);
        });

        it('should accept valid GUID v3 format', () => {
            expect(isGuid('6ba7b814-9dad-31d1-80b4-00c04fd430c8')).toBe(true);
        });

        it('should accept valid GUID v4 format', () => {
            expect(isGuid('6ba7b815-9dad-41d1-80b4-00c04fd430c8')).toBe(true);
        });

        it('should accept valid GUID v5 format', () => {
            expect(isGuid('6ba7b816-9dad-51d1-80b4-00c04fd430c8')).toBe(true);
        });

        it('should accept nil GUID', () => {
            expect(isGuid('00000000-0000-0000-0000-000000000000')).toBe(true);
        });

        it('should accept max GUID', () => {
            expect(isGuid('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF')).toBe(true);
        });

        it('should be case insensitive', () => {
            expect(isGuid('6BA7B815-9DAD-41D1-80B4-00C04FD430C8')).toBe(true);
            expect(isGuid('6ba7b815-9dad-41d1-80b4-00c04fd430c8')).toBe(true);
            expect(isGuid('6Ba7B815-9DaD-41D1-80b4-00C04Fd430c8')).toBe(true);
        });

        it('should reject invalid GUID formats', () => {
            // Too short
            expect(isGuid('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
            
            // Too long
            expect(isGuid('550e8400-e29b-41d4-a716-4466554400000')).toBe(false);
            
            // Missing hyphens
            expect(isGuid('550e8400e29b41d4a716446655440000')).toBe(false);
            
            // Wrong hyphen positions
            expect(isGuid('550e840-0e29b-41d4-a716-446655440000')).toBe(false);
            
            // Missing parts
            expect(isGuid('550e8400-e29b-41d4-a716')).toBe(false);
            
            // Invalid characters
            expect(isGuid('550e8400-e29g-41d4-a716-446655440000')).toBe(false);
            expect(isGuid('550e8400-e29b-41d4-a716-44665544000z')).toBe(false);
            
            // Non-string values
            expect(isGuid(null)).toBe(false);
            expect(isGuid(undefined)).toBe(false);
            expect(isGuid(123)).toBe(false);
            expect(isGuid({})).toBe(false);
            expect(isGuid([])).toBe(false);
            
            // Random strings
            expect(isGuid('not-a-guid-at-all')).toBe(false);
            expect(isGuid('')).toBe(false);
            expect(isGuid('hello world')).toBe(false);
        });

        it('should follow OData v4 ABNF specification', () => {
            // OData v4 ABNF: guidValue = 8HEXDIG "-" 4HEXDIG "-" 4HEXDIG "-" 4HEXDIG "-" 12HEXDIG
            // This test ensures our regex matches the specification exactly
            
            // Test boundary cases
            expect(isGuid('00000000-0000-0000-0000-000000000000')).toBe(true); // All zeros
            expect(isGuid('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true); // All f's
            expect(isGuid('12345678-1234-1234-1234-123456789abc')).toBe(true); // Mixed case
            
            // Test all valid hex characters (following 8-4-4-4-12 pattern)
            expect(isGuid('01234567-89ab-cdef-0123-456789abcdef')).toBe(true);
            expect(isGuid('01234567-89AB-CDEF-0123-456789ABCDEF')).toBe(true);
        });
    });

    describe('getValueType', () => {
        it('should correctly identify GUID values', () => {
            expect(getValueType('550e8400-e29b-41d4-a716-446655440000')).toBe('Guid');
            expect(getValueType('6ba7b815-9dad-41d1-80b4-00c04fd430c8')).toBe('Guid');
            expect(getValueType('00000000-0000-0000-0000-000000000000')).toBe('Guid');
        });

        it('should identify invalid GUIDs as strings', () => {
            expect(getValueType('550e8400-e29b-41d4-a716-44665544000')).toBe('string'); // Invalid GUID
            expect(getValueType('not-a-guid')).toBe('string');
            expect(getValueType('550e8400e29b41d4a716446655440000')).toBe('string'); // No hyphens
        });

        it('should correctly identify other types', () => {
            expect(getValueType(null)).toBe('null');
            expect(getValueType(new Date())).toBe('Date');
            expect(getValueType(123)).toBe('number');
            expect(getValueType(true)).toBe('boolean');
            expect(getValueType('hello')).toBe('string');
            expect(getValueType({})).toBe('unknown');
        });
    });

    describe('isValidOperator', () => {
        it('should allow correct operators for GUID type', () => {
            expect(isValidOperator('Guid', 'eq')).toBe(true);
            expect(isValidOperator('Guid', 'ne')).toBe(true);
        });

        it('should reject invalid operators for GUID type', () => {
            expect(isValidOperator('Guid', 'contains')).toBe(false);
            expect(isValidOperator('Guid', 'startswith')).toBe(false);
            expect(isValidOperator('Guid', 'gt')).toBe(false);
            expect(isValidOperator('Guid', 'lt')).toBe(false);
        });

        it('should allow string operators for regular strings', () => {
            expect(isValidOperator('string', 'contains')).toBe(true);
            expect(isValidOperator('string', 'startswith')).toBe(true);
            expect(isValidOperator('string', 'eq')).toBe(true);
        });
    });

    describe('isValidTransform', () => {
        it('should allow valid transforms for GUID type', () => {
            expect(isValidTransform('Guid', ['tolower'])).toBe(true);
        });

        it('should reject invalid transforms for GUID type', () => {
            expect(isValidTransform('Guid', ['toupper'])).toBe(false);
            expect(isValidTransform('Guid', ['trim'])).toBe(false);
            expect(isValidTransform('Guid', ['round'])).toBe(false);
        });

        it('should handle empty transforms', () => {
            expect(isValidTransform('Guid', [])).toBe(true);
            expect(isValidTransform('Guid', undefined)).toBe(true);
        });
    });
});

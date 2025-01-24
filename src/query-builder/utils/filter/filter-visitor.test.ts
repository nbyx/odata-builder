import { ODataFilterVisitor } from './filter-visitor';
import { QueryFilter } from 'src/query-builder/types/filter/query-filter.type';
import { CombinedFilter } from 'src/query-builder/types/filter/combined-filter.type';
import { describe, beforeEach, it, expect } from 'vitest';

describe('ODataFilterVisitor', () => {
    type ItemType = {
        id: string;
        isActive: boolean;
        age: number;
        tags: string[];
        details: { name: string; value: number };
    };

    let visitor: ODataFilterVisitor<ItemType>;

    beforeEach(() => {
        visitor = new ODataFilterVisitor<ItemType>();
    });

    describe('visitBasicFilter', () => {
        it('should handle a basic filter with a string value', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'id',
                operator: 'eq',
                value: '123',
            };

            const result = visitor.visitBasicFilter(filter);

            expect(result).toBe("id eq '123'");
        });

        it('should handle a basic filter with ignoreCase set to true', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'id',
                operator: 'eq',
                value: '123',
                ignoreCase: true,
            };

            const result = visitor.visitBasicFilter(filter);

            expect(result).toBe("tolower(id) eq '123'");
        });

        it('should handle a basic filter with transformations', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'id',
                operator: 'eq',
                value: '123',
                transform: ['trim', 'tolower'],
            };

            const result = visitor.visitBasicFilter(filter);

            expect(result).toBe("tolower(trim(id)) eq '123'");
        });

        it('should handle a basic filter with a numeric value', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'age',
                operator: 'gt',
                value: 18,
            };

            const result = visitor.visitBasicFilter(filter);

            expect(result).toBe('age gt 18');
        });

        it('should handle a basic filter with a boolean value', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'isActive',
                operator: 'eq',
                value: true,
            };

            const result = visitor.visitBasicFilter(filter);

            expect(result).toBe('isActive eq true');
        });

        it('should throw an error for a filter missing the "value" property', () => {
            const filter = {
                field: 'id',
                operator: 'eq',
            } as unknown as QueryFilter<ItemType>;

            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                'Invalid BasicFilter: missing "value" property',
            );
        });
    });

    describe('visitLambdaFilter', () => {
        it('should handle a lambda filter with a basic filter as expression', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'tags',
                lambdaOperator: 'any',
                expression: { field: '', operator: 'eq', value: '123' },
            };

            const result = visitor.visitLambdaFilter<ItemType>(filter);

            expect(result).toBe("tags/any(s: s eq '123')");
        });

        it('should handle a lambda filter with a field in the expression', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'tags',
                lambdaOperator: 'any',
                expression: { field: 'id', operator: 'eq', value: '123' },
            };

            const result = visitor.visitLambdaFilter<ItemType>(filter);

            expect(result).toBe("tags/any(s: s/id eq '123')");
        });

        it('should throw an error for an invalid lambda filter', () => {
            const filter = {
                field: 'tags',
                lambdaOperator: 'any',
            } as unknown as QueryFilter<ItemType>;

            expect(() => visitor.visitLambdaFilter(filter)).toThrow(
                /Invalid LambdaFilter/,
            );
        });
    });

    describe('visitCombinedFilter', () => {
        it('should handle combined filters with "and" logic', () => {
            const filter: CombinedFilter<ItemType> = {
                logic: 'and',
                filters: [
                    { field: 'isActive', operator: 'eq', value: true },
                    { field: 'age', operator: 'gt', value: 18 },
                ],
            };

            const result = visitor.visitCombinedFilter(filter);

            expect(result).toBe('(isActive eq true and age gt 18)');
        });

        it('should handle nested combined filters', () => {
            const filter: CombinedFilter<ItemType> = {
                logic: 'and',
                filters: [
                    { field: 'isActive', operator: 'eq', value: true },
                    {
                        logic: 'or',
                        filters: [
                            { field: 'age', operator: 'gt', value: 18 },
                            { field: 'age', operator: 'lt', value: 65 },
                        ],
                    },
                ],
            };

            const result = visitor.visitCombinedFilter(filter);

            expect(result).toBe(
                '(isActive eq true and (age gt 18 or age lt 65))',
            );
        });

        it('should throw an error for an invalid combined filter', () => {
            const filter = {
                logic: 'and',
                filters: [{}],
            } as unknown as CombinedFilter<ItemType>;

            expect(() => visitor.visitCombinedFilter(filter)).toThrow(
                /Invalid sub-filter/,
            );
        });
    });

    describe('Integration Tests', () => {
        it('should handle a filter query with mixed filters', () => {
            const filter: CombinedFilter<ItemType> = {
                logic: 'and',
                filters: [
                    { field: 'isActive', operator: 'eq', value: true },
                    {
                        field: 'tags',
                        lambdaOperator: 'any',
                        expression: {
                            field: '',
                            operator: 'eq',
                            value: '123',
                        },
                    },
                    {
                        logic: 'or',
                        filters: [
                            { field: 'age', operator: 'gt', value: 18 },
                            { field: 'age', operator: 'lt', value: 65 },
                        ],
                    },
                ],
            };

            const result = visitor.visitCombinedFilter(filter);

            expect(result).toBe(
                "(isActive eq true and tags/any(s: s eq '123') and (age gt 18 or age lt 65))",
            );
        });
    });
});

describe('ODataFilterVisitor with Functions', () => {
    type ItemType = {
        id: string;
        isActive: boolean;
        age: number;
        tags: string[];
        details: { name: string; value: number };
        createdAt: Date;
    };

    let visitor: ODataFilterVisitor<ItemType>;

    beforeEach(() => {
        visitor = new ODataFilterVisitor<ItemType>();
    });

    describe('visitBasicFilter with functions', () => {
        it('should handle a string concat function', () => {
            const filter: QueryFilter<ItemType> = {
                function: {
                    type: 'concat',
                    values: ['Hello'],
                },
                field: 'details/name',
                operator: 'eq',
                value: 'Hello John',
            };

            const result = visitor.visitBasicFilter(filter);

            expect(result).toBe(
                "concat(details/name, 'Hello') eq 'Hello John'",
            );
        });

        it('should handle an arithmetic add function for numbers', () => {
            const filter: QueryFilter<ItemType> = {
                function: {
                    type: 'add',
                    operand: 10,
                },
                field: 'age',
                operator: 'eq',
                value: 30,
            };

            const result = visitor.visitBasicFilter(filter);

            expect(result).toBe('age add 10 eq 30');
        });

        it('should handle a now function for dates', () => {
            const filter: QueryFilter<ItemType> = {
                function: {
                    type: 'now',
                },
                field: 'createdAt',
                operator: 'gt',
                value: new Date('2023-01-01'),
            };

            const result = visitor.visitBasicFilter(filter);

            expect(result).toBe('now() gt 2023-01-01T00:00:00.000Z');
        });

        it('should throw an error for an invalid function definition', () => {
            const filter = {
                function: {
                    type: 'add',
                },
                field: 'age',
                operator: 'eq',
                value: 30,
            } as unknown as QueryFilter<ItemType>;

            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                /Invalid function definition/,
            );
        });
    });

    describe('visitCombinedFilter with functions', () => {
        it('should handle combined filters with functions', () => {
            const filter: CombinedFilter<ItemType> = {
                logic: 'and',
                filters: [
                    {
                        function: {
                            type: 'add',
                            operand: 10,
                        },
                        field: 'age',
                        operator: 'eq',
                        value: 30,
                    },
                    {
                        function: {
                            type: 'concat',
                            values: ['Hello'],
                        },
                        field: 'details/name',
                        operator: 'eq',
                        value: 'Hello John',
                    },
                ],
            };

            const result = visitor.visitCombinedFilter(filter);

            expect(result).toBe(
                "(age add 10 eq 30 and concat(details/name, 'Hello') eq 'Hello John')",
            );
        });

        it('should handle nested combined filters with functions', () => {
            const filter: CombinedFilter<ItemType> = {
                logic: 'or',
                filters: [
                    {
                        function: {
                            type: 'mul',
                            operand: 2,
                        },
                        field: 'age',
                        operator: 'gt',
                        value: 40,
                    },
                    {
                        logic: 'and',
                        filters: [
                            {
                                field: 'createdAt',
                                operator: 'lt',
                                value: new Date('2023-01-01'),
                            },
                            {
                                field: 'isActive',
                                operator: 'eq',
                                value: true,
                            },
                        ],
                    },
                ],
            };

            const result = visitor.visitCombinedFilter(filter);

            expect(result).toBe(
                '(age mul 2 gt 40 or (createdAt lt 2023-01-01T00:00:00.000Z and isActive eq true))',
            );
        });
    });

    describe('Integration Tests', () => {
        it('should handle mixed filters with functions and basic filters', () => {
            const filter: CombinedFilter<ItemType> = {
                logic: 'and',
                filters: [
                    {
                        function: {
                            type: 'add',
                            operand: 10,
                        },
                        field: 'age',
                        operator: 'eq',
                        value: 30,
                    },
                    { field: 'isActive', operator: 'eq', value: true },
                    {
                        function: {
                            type: 'concat',
                            values: ['Hello'],
                        },
                        field: 'details/name',
                        operator: 'eq',
                        value: 'Hello John',
                    },
                ],
            };

            const result = visitor.visitCombinedFilter(filter);

            expect(result).toBe(
                "(age add 10 eq 30 and isActive eq true and concat(details/name, 'Hello') eq 'Hello John')",
            );
        });
    });
});

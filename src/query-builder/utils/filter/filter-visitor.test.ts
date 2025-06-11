import { ODataFilterVisitor } from './filter-visitor';
import {
    QueryFilter,
    LambdaFilter,
    ArrayElement,
} from 'src/query-builder/types/filter/query-filter.type';
import { CombinedFilter } from 'src/query-builder/types/filter/combined-filter.type';
import { describe, beforeEach, it, expect } from 'vitest';

describe('ODataFilterVisitor', () => {
    type ItemType = {
        id: string;
        isActive: boolean;
        age: number;
        tags: string[];
        details: { name: string; value: number; code: string };
        complexTags: Array<{ tagValue: string; relevance: number }>;
        startDate: Date;
        endDate: Date | null;
        optionalName?: string;
        valueA: number;
        valueB: number;
        stringField: string;
        anotherStringField: string;
        numericField: number;
        anotherNumericField: number;
        dateField: Date;
        anotherDateField: Date;
        timeOnlyField: string;
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

        it('should handle a basic filter with ignoreCase set to true for eq operator', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'id',
                operator: 'eq',
                value: 'abc',
                ignoreCase: true,
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe("tolower(id) eq 'abc'");
        });

        it('should handle contains operator with ignoreCase', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'id',
                operator: 'contains',
                value: 'AbC',
                ignoreCase: true,
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe("contains(tolower(id), 'abc')");
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

        it('should throw an error if called with a non-basic filter structure (missing value)', () => {
            const filterMissingValue = {
                field: 'id',
                operator: 'eq',
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filterMissingValue)).toThrow(
                'visitBasicFilter called with a non-basic filter type. This indicates a dispatching logic error.',
            );
        });

        it('should throw an error if called with a lambda filter structure', () => {
            const lambdaLikeFilter = {
                field: 'tags',
                lambdaOperator: 'any',
                expression: { field: '', operator: 'eq', value: 'test' },
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(lambdaLikeFilter)).toThrow(
                'visitBasicFilter called with a non-basic filter type. This indicates a dispatching logic error.',
            );
        });
    });

    describe('visitLambdaFilter', () => {
        it('should handle a lambda filter with a basic filter as expression on string array', () => {
            const stringElementExpression: QueryFilter<string> = {
                field: '',
                operator: 'eq',
                value: '123',
            };
            const filter = {
                field: 'tags',
                lambdaOperator: 'any',
                expression: stringElementExpression,
            } as LambdaFilter<ItemType>;
            const result = visitor.visitLambdaFilter(filter);
            expect(result).toBe("tags/any(s: s eq '123')");
        });

        it('should handle a lambda filter with a field in the expression on object array', () => {
            type ComplexTagElement = ArrayElement<ItemType, 'complexTags'>;
            const expressionForObjectElement: QueryFilter<ComplexTagElement> = {
                field: 'tagValue',
                operator: 'eq',
                value: 'important',
            };
            const filter = {
                field: 'complexTags',
                lambdaOperator: 'any',
                expression: expressionForObjectElement,
            } as LambdaFilter<ItemType>;
            const result = visitor.visitLambdaFilter(filter);
            expect(result).toBe(
                "complexTags/any(s: s/tagValue eq 'important')",
            );
        });

        it('should throw an error for an invalid lambda filter structure (missing expression)', () => {
            const invalidLambdaObject = {
                field: 'tags',
                lambdaOperator: 'any',
            } as unknown as LambdaFilter<ItemType>;
            expect(() =>
                visitor.visitLambdaFilter(invalidLambdaObject),
            ).toThrow(
                `Invalid LambdaFilter on field "tags": "expression" property is missing or not an object.`,
            );
        });

        it('should throw an error if expression in lambda filter is not an object', () => {
            const invalidLambdaObject = {
                field: 'tags',
                lambdaOperator: 'any',
                expression: 'not-an-object',
            } as unknown as LambdaFilter<ItemType>;
            expect(() =>
                visitor.visitLambdaFilter(invalidLambdaObject),
            ).toThrow(
                `Invalid LambdaFilter on field "tags": "expression" property is missing or not an object.`,
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

        it('should throw an error for an invalid sub-filter in combined filter', () => {
            const filterWithInvalidSubFilter = {
                logic: 'and',
                filters: [{}],
            } as unknown as CombinedFilter<ItemType>;
            expect(() =>
                visitor.visitCombinedFilter(filterWithInvalidSubFilter),
            ).toThrow(/Unsupported expression type in visitExpression/);
        });

        it('should throw if combined filter has no "filters" array', () => {
            const filterMissingFiltersArray = {
                logic: 'and',
            } as unknown as CombinedFilter<ItemType>;
            expect(() =>
                visitor.visitCombinedFilter(filterMissingFiltersArray),
            ).toThrow(
                'Invalid CombinedFilter: "filters" property is missing or not an array.',
            );
        });

        it('should throw if sub-filter in combined filter is null', () => {
            const filterWithNullSubFilter = {
                logic: 'and',
                filters: [null],
            } as unknown as CombinedFilter<ItemType>;
            expect(() =>
                visitor.visitCombinedFilter(filterWithNullSubFilter),
            ).toThrow(
                'Invalid sub-filter in CombinedFilter: sub-filter is not an object or is null.',
            );
        });

        it('should return empty string for combined filter with empty filters array', () => {
            const filter: CombinedFilter<ItemType> = {
                logic: 'and',
                filters: [],
            };
            const result = visitor.visitCombinedFilter(filter);
            expect(result).toBe('');
        });

        it('should handle combined filter with a single filter, wrapping it in parentheses', () => {
            const filter: CombinedFilter<ItemType> = {
                logic: 'and',
                filters: [{ field: 'isActive', operator: 'eq', value: true }],
            };
            const result = visitor.visitCombinedFilter(filter);
            expect(result).toBe('(isActive eq true)');
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
        details: { name: string; value: number; code: string };
        complexTags: Array<{ tagValue: string; relevance: number }>;
        startDate: Date;
        endDate: Date | null;
        optionalName?: string;
        valueA: number;
        valueB: number;
        stringField: string;
        anotherStringField: string;
        numericField: number;
        anotherNumericField: number;
        dateField: Date;
        anotherDateField: Date;
        timeOnlyField: string;
    };

    let visitor: ODataFilterVisitor<ItemType>;

    beforeEach(() => {
        visitor = new ODataFilterVisitor<ItemType>();
    });

    describe('visitBasicFilter with functions', () => {
        // String Functions
        it('should handle string concat function with literal and fieldReference', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'details/name',
                function: {
                    type: 'concat',
                    values: ['-PK', { fieldReference: 'details/code' }],
                },
                operator: 'eq',
                value: 'ProductName-PK123',
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe(
                "concat(details/name, '-PK', details/code) eq 'ProductName-PK123'",
            );
        });

        it('should handle string contains (as function) with fieldReference, direct boolean', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'stringField',
                function: {
                    type: 'contains',
                    value: { fieldReference: 'anotherStringField' },
                },
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe('contains(stringField, anotherStringField)');
        });

        it('should handle string contains (as function) with explicit "eq false"', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'contains', value: 'text' },
                operator: 'eq',
                value: false,
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe("contains(stringField, 'text') eq false");
        });

        it('should handle string endswith function (direct boolean)', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'endswith', value: 'suffix' },
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe("endswith(stringField, 'suffix')");
        });

        it('should handle string indexof function (returns number)', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'indexof', value: 'sub' },
                operator: 'eq',
                value: 2,
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe("indexof(stringField, 'sub') eq 2");
        });

        it('should handle string length function (returns number)', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'length' },
                operator: 'gt',
                value: 5,
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe('length(stringField) gt 5');
        });

        it('should handle string startswith function (direct boolean)', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'startswith', value: 'prefix' },
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe("startswith(stringField, 'prefix')");
        });

        it('should handle string substring function (start only, returns string)', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'substring', start: 1 },
                operator: 'eq',
                value: 'ubstring',
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe("substring(stringField, 1) eq 'ubstring'");
        });

        it('should handle string substring function (start and length, returns string)', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'stringField',
                function: {
                    type: 'substring',
                    start: 1,
                    length: { fieldReference: 'numericField' },
                },
                operator: 'eq',
                value: 'sub',
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe(
                "substring(stringField, 1, numericField) eq 'sub'",
            );
        });

        it('should handle tolower, toupper, trim functions (return string)', () => {
            const filterLower: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'tolower' },
                operator: 'eq',
                value: 'lower case version',
            };
            expect(visitor.visitBasicFilter(filterLower)).toBe(
                "tolower(stringField) eq 'lower case version'",
            );

            const filterUpper: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'toupper' },
                operator: 'eq',
                value: 'UPPER CASE VERSION',
            };
            expect(visitor.visitBasicFilter(filterUpper)).toBe(
                "toupper(stringField) eq 'UPPER CASE VERSION'",
            );

            const filterTrim: QueryFilter<ItemType> = {
                field: 'stringField',
                function: { type: 'trim' },
                operator: 'eq',
                value: 'trimmed version',
            };
            expect(visitor.visitBasicFilter(filterTrim)).toBe(
                "trim(stringField) eq 'trimmed version'",
            );
        });

        // Arithmetic Functions
        it('should handle arithmetic functions: add, sub, mul, div, mod (return number)', () => {
            const filterAdd: QueryFilter<ItemType> = {
                field: 'age',
                function: { type: 'add', operand: 5 },
                operator: 'eq',
                value: 15,
            };
            expect(visitor.visitBasicFilter(filterAdd)).toBe('age add 5 eq 15');
            const filterSub: QueryFilter<ItemType> = {
                field: 'age',
                function: { type: 'sub', operand: 5 },
                operator: 'eq',
                value: 10,
            };
            expect(visitor.visitBasicFilter(filterSub)).toBe('age sub 5 eq 10');
            const filterMul: QueryFilter<ItemType> = {
                field: 'age',
                function: { type: 'mul', operand: 2 },
                operator: 'eq',
                value: 40,
            };
            expect(visitor.visitBasicFilter(filterMul)).toBe('age mul 2 eq 40');
            const filterDiv: QueryFilter<ItemType> = {
                field: 'age',
                function: {
                    type: 'div',
                    operand: { fieldReference: 'valueA' },
                },
                operator: 'eq',
                value: 2,
            };
            expect(visitor.visitBasicFilter(filterDiv)).toBe(
                'age div valueA eq 2',
            );
            const filterMod: QueryFilter<ItemType> = {
                field: 'age',
                function: { type: 'mod', operand: 5 },
                operator: 'eq',
                value: 0,
            };
            expect(visitor.visitBasicFilter(filterMod)).toBe('age mod 5 eq 0');
        });

        it('should handle numeric functions: round, floor, ceiling (return number)', () => {
            const filterRound: QueryFilter<ItemType> = {
                field: 'details/value',
                function: { type: 'round' },
                operator: 'eq',
                value: 10,
            };
            expect(visitor.visitBasicFilter(filterRound)).toBe(
                'round(details/value) eq 10',
            );
            const filterFloor: QueryFilter<ItemType> = {
                field: 'details/value',
                function: { type: 'floor' },
                operator: 'eq',
                value: 9,
            };
            expect(visitor.visitBasicFilter(filterFloor)).toBe(
                'floor(details/value) eq 9',
            );
            const filterCeiling: QueryFilter<ItemType> = {
                field: 'details/value',
                function: { type: 'ceiling' },
                operator: 'eq',
                value: 10,
            };
            expect(visitor.visitBasicFilter(filterCeiling)).toBe(
                'ceiling(details/value) eq 10',
            );
        });

        // Date/Time Functions
        it('should handle date() function with fieldReference and OData date literal', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'anotherDateField',
                function: {
                    type: 'date',
                    field: { fieldReference: 'anotherDateField' },
                },
                operator: 'eq',
                value: '2023-07-15',
                removeQuotes: true,
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe('date(anotherDateField) eq 2023-07-15');
        });

        it('should handle time() function with fieldReference and OData time literal', () => {
            const filter: QueryFilter<ItemType> = {
                field: 'anotherDateField',
                function: {
                    type: 'time',
                    field: { fieldReference: 'anotherDateField' },
                },
                operator: 'gt',
                value: '12:00:00.000',
                removeQuotes: true,
            };
            const result = visitor.visitBasicFilter(filter);
            expect(result).toBe('time(anotherDateField) gt 12:00:00.000');
        });

        it('should handle year, month, day, hour, minute, second functions (return number)', () => {
            const filterYear: QueryFilter<ItemType> = {
                field: 'startDate',
                function: { type: 'year' },
                operator: 'eq',
                value: 2023,
            };
            expect(visitor.visitBasicFilter(filterYear)).toBe(
                'year(startDate) eq 2023',
            );
            const filterMonth: QueryFilter<ItemType> = {
                field: 'dateField',
                function: { type: 'month' },
                operator: 'eq',
                value: 12,
            };
            expect(visitor.visitBasicFilter(filterMonth)).toBe(
                'month(dateField) eq 12',
            );
            const filterDay: QueryFilter<ItemType> = {
                field: 'dateField',
                function: { type: 'day' },
                operator: 'eq',
                value: 15,
            };
            expect(visitor.visitBasicFilter(filterDay)).toBe(
                'day(dateField) eq 15',
            );
            const filterHour: QueryFilter<ItemType> = {
                field: 'dateField',
                function: { type: 'hour' },
                operator: 'eq',
                value: 10,
            };
            expect(visitor.visitBasicFilter(filterHour)).toBe(
                'hour(dateField) eq 10',
            );
            const filterMinute: QueryFilter<ItemType> = {
                field: 'dateField',
                function: { type: 'minute' },
                operator: 'eq',
                value: 30,
            };
            expect(visitor.visitBasicFilter(filterMinute)).toBe(
                'minute(dateField) eq 30',
            );
            const filterSecond: QueryFilter<ItemType> = {
                field: 'dateField',
                function: { type: 'second' },
                operator: 'eq',
                value: 0,
            };
            expect(visitor.visitBasicFilter(filterSecond)).toBe(
                'second(dateField) eq 0',
            );
        });

        it('should handle now function for date comparison (now as LHS)', () => {
            const testDate = new Date('2200-01-01T00:00:00.000Z');
            const filterNowAsLHS: QueryFilter<ItemType> = {
                field: 'anotherDateField',
                function: { type: 'now' },
                operator: 'lt',
                value: testDate,
            };
            const result = visitor.visitBasicFilter(filterNowAsLHS);
            expect(result).toBe(`now() lt ${testDate.toISOString()}`);
        });

        // Fehlerfälle für Funktionsdefinitionen
        it('should throw for concat without values', () => {
            const filter = {
                field: 'id',
                function: { type: 'concat' },
                operator: 'eq',
                value: 'test',
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                /Invalid function definition for 'concat': 'values' array is missing/,
            );
        });
        it('should throw for contains without value property in function def', () => {
            const filter = {
                field: 'id',
                function: { type: 'contains' },
                operator: 'eq',
                value: true,
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                /Invalid function definition for 'contains': 'value' property is missing/,
            );
        });
        it('should throw for substring without start property in function def', () => {
            const filter = {
                field: 'id',
                function: { type: 'substring' },
                operator: 'eq',
                value: 't',
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                /Invalid function definition for 'substring': 'start' property is missing/,
            );
        });
        it('should throw for add without operand property in function def', () => {
            const filter = {
                field: 'age',
                function: { type: 'add' },
                operator: 'eq',
                value: 10,
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                /Invalid function definition for 'add': 'operand' property is missing/,
            );
        });
        it('should throw for date function without field property in function def', () => {
            const filter = {
                field: 'startDate',
                function: { type: 'date' },
                operator: 'eq',
                value: '2023-01-01',
                removeQuotes: true,
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                /Invalid function definition for 'date': 'field' property is missing/,
            );
        });
        it('should throw for date function with invalid fieldReference in function def', () => {
            const filter = {
                field: 'startDate',
                function: { type: 'date', field: {} },
                operator: 'eq',
                value: '2023-01-01',
                removeQuotes: true,
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                /Invalid FieldReference: It must be an object with a 'fieldReference' property that is a non-empty string/,
            );
        });
        it('should throw for function with empty type string', () => {
            const filter = {
                field: 'id',
                function: { type: ' ' },
                operator: 'eq',
                value: 'test',
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                /Invalid function definition on field "id": "type" property is missing, not a string, or empty./,
            );
        });
        it('should throw for numeric function (e.g. length) without operator/value for comparison', () => {
            const filter = {
                field: 'stringField',
                function: { type: 'length' },
            } as unknown as QueryFilter<ItemType>;
            expect(() => visitor.visitBasicFilter(filter)).toThrow(
                'Operator and value are required for comparing the result of function type "length" on field "stringField".',
            );
        });
    });

    describe('Functions in Lambda Expressions', () => {
        it('should handle length function within a lambda on string array', () => {
            const filter = {
                field: 'tags',
                lambdaOperator: 'any',
                expression: {
                    field: '',
                    function: { type: 'length' },
                    operator: 'gt',
                    value: 3,
                },
            } as LambdaFilter<ItemType>;
            const result = visitor.visitLambdaFilter(filter);
            expect(result).toBe('tags/any(s: length(s) gt 3)');
        });

        it('should handle tolower function within a lambda on object array property', () => {
            const filter = {
                field: 'complexTags',
                lambdaOperator: 'all',
                expression: {
                    field: 'tagValue',
                    function: { type: 'tolower' },
                    operator: 'eq',
                    value: 'important',
                },
            } as LambdaFilter<ItemType>;
            const result = visitor.visitLambdaFilter(filter);
            expect(result).toBe(
                "complexTags/all(s: tolower(s/tagValue) eq 'important')",
            );
        });

        it('should handle year function within a lambda on date array', () => {
            type ItemWithDates = { eventDates: Date[] };
            const filter = {
                field: 'eventDates',
                lambdaOperator: 'any',
                expression: {
                    field: '',
                    function: { type: 'year' },
                    operator: 'eq',
                    value: 2023,
                },
            };
            const visitorDates = new ODataFilterVisitor<ItemWithDates>();
            const result = visitorDates.visitLambdaFilter(
                filter as LambdaFilter<ItemType>,
            );
            expect(result).toBe('eventDates/any(s: year(s) eq 2023)');
        });

        it('should handle direct boolean contains function in lambda', () => {
            const filter = {
                field: 'tags',
                lambdaOperator: 'any',
                expression: {
                    field: '',
                    function: { type: 'contains', value: 'urgent' },
                },
            } as LambdaFilter<ItemType>;
            const result = visitor.visitLambdaFilter(filter);
            expect(result).toBe("tags/any(s: contains(s, 'urgent'))");
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
                                field: 'startDate',
                                operator: 'lt',
                                value: new Date('2023-01-01T00:00:00.000Z'),
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
                '(age mul 2 gt 40 or (startDate lt 2023-01-01T00:00:00.000Z and isActive eq true))',
            );
        });
    });
});

import { Guid } from 'src/query-builder/types/utils/util.types';
import { StringAsFunctionOperators } from 'src/query-builder/types/filter/query-filter.type';

export const operatorTypeMap: Record<string, ReadonlyArray<string>> = {
    string: Object.freeze([
        'eq',
        'ne',
        'contains',
        'startswith',
        'endswith',
        'substringof',
        'indexof',
    ]),
    number: Object.freeze(['eq', 'ne', 'lt', 'le', 'gt', 'ge']),
    boolean: Object.freeze(['eq', 'ne']),
    Date: Object.freeze(['eq', 'ne', 'lt', 'le', 'gt', 'ge']),
    Guid: Object.freeze(['eq', 'ne']),
    null: Object.freeze(['eq', 'ne']),
};

export const transformTypeMap: Record<string, ReadonlyArray<string>> = {
    string: Object.freeze(['tolower', 'toupper', 'trim', 'length']),
    number: Object.freeze(['round', 'floor', 'ceiling']),
    Date: Object.freeze(['year', 'month', 'day', 'hour', 'minute', 'second']),
    Guid: Object.freeze(['tolower']),
};

export const odataStringFunctions: ReadonlySet<StringAsFunctionOperators> =
    new Set<StringAsFunctionOperators>([
        'contains',
        'startswith',
        'endswith',
        'substringof',
        'indexof',
    ]);

export function isValidOperator(type: string, operator: string): boolean {
    const validOperators = operatorTypeMap[type] || [];
    return validOperators.includes(operator);
}

export function isValidTransform(
    type: string,
    transforms?: ReadonlyArray<string>,
): boolean {
    if (!transforms || transforms.length === 0) return true;
    const validTransforms = transformTypeMap[type] || [];
    return transforms.every(t => validTransforms.includes(t));
}

export function getValueType(value: unknown): string {
    if (value === null) return 'null';
    if (value instanceof Date) return 'Date';
    if (typeof value === 'string' && isGuid(value)) return 'Guid';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') return 'string';
    return 'unknown';
}

export function isGuid(val: unknown): val is Guid {
    if (typeof val !== 'string') return false;
    // OData v4 ABNF specification: guidValue = 8HEXDIG "-" 4HEXDIG "-" 4HEXDIG "-" 4HEXDIG "-" 12HEXDIG
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val,
    );
}

import { Guid } from 'src';

export const operatorTypeMap: Record<string, string[]> = {
    string: [
        'eq',
        'ne',
        'contains',
        'startswith',
        'endswith',
        'substringof',
        'indexof',
        'concat',
    ],
    number: ['eq', 'ne', 'lt', 'le', 'gt', 'ge'],
    boolean: ['eq', 'ne'],
    Date: ['eq', 'ne', 'lt', 'le', 'gt', 'ge'],
    Guid: ['eq', 'ne'],
    null: ['eq', 'ne'],
};

export const transformTypeMap: Record<string, string[]> = {
    string: ['tolower', 'toupper', 'trim', 'length'],
    number: ['round', 'floor', 'ceiling'],
    Date: ['year', 'month', 'day', 'hour', 'minute', 'second'],
    Guid: ['tolower'],
};

export const isValidOperator = (type: string, operator: string): boolean => {
    const validOperators = operatorTypeMap[type] || [];
    return validOperators.includes(operator);
};

export const isValidTransform = (
    type: string,
    transforms?: string[],
): boolean => {
    if (!transforms) return true;
    const validTransforms = transformTypeMap[type] || [];
    return transforms.every(t => validTransforms.includes(t));
};

export const getValueType = (value: unknown): string => {
    if (value === null) return 'null';
    if (value instanceof Date) return 'Date';
    if (typeof value === 'string' && isGuid(value)) return 'Guid';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') return 'string';
    return 'unknown';
};

export const isGuid = (val: unknown): val is Guid =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        val,
    );

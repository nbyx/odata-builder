import { ExpandFields } from 'src/query-builder/types/expand/expand-fields.type';

export const toExpandQuery = <T>(expandProps: ExpandFields<T>[]): string => {
    return `$expand=${expandProps.join(', ')}`;
};

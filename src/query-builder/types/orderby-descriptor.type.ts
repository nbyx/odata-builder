export type OrderByDescriptor<T> = {
    field: Extract<keyof T, string>;
    orderDirection: 'asc' | 'desc';
};

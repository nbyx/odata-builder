export interface OrderByDescriptor<T> {
    field: OrderByFields<T>;
    orderDirection: 'asc' | 'desc';
}

export type OrderByFields<T> = {
    [K in Extract<keyof T, string>]-?: T[K] extends Record<string, unknown>
        ? {
              [TK in Extract<keyof T[K], string>]-?: `${K}/${TK}` | K;
          }[Extract<keyof T[K], string>]
        : never;
}[Extract<keyof T, string>];

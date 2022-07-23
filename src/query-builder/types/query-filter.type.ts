import { Guid } from './util.types';

type FilterOperators = 'eq' | 'contains' | 'ne' | 'lte' | 'gte' | 'ge';

type FilterString<T, VALUETYPE> = {
    [K in Extract<keyof T, string>]-?: T[K] extends Record<string, unknown>
        ? T[K] extends VALUETYPE
            ? K
            :
                  | never
                  | {
                        [TK in Extract<
                            keyof T[K],
                            string
                        >]-?: T[K][TK] extends VALUETYPE ? `${K}/${TK}` : never;
                    }[Extract<keyof T[K], string>]
        : T[K] extends VALUETYPE
        ? K
        : never;
}[Extract<keyof T, string>];

export type QueryFilter<T> = { operator: FilterOperators } & (
    | {
          field: FilterString<T, boolean>;
          value: boolean;
      }
    | {
          field: FilterString<T, string>;
          value: string;
          ignoreCase?: boolean;
      }
    | {
          field: FilterString<T, Date>;
          value: Date;
      }
    | {
          field: FilterString<T, Guid>;
          value: Guid;
          removeQuotes?: boolean;
      }
    | {
          field: FilterString<T, number>;
          value: number;
      }
);

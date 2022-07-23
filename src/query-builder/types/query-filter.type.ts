import { Guid } from './util.types';

type StringFilterOperators =
    | 'eq'
    | 'contains'
    | 'startswith'
    | 'endswith'
    | 'ne';
type NumberFilterOperators = 'eq' | 'ne' | 'ge' | 'gt' | 'le' | 'lt';
type DateFilterOperators = '';

type FilterOperators<VALUETYPE> = 'eq' | 'ne' | VALUETYPE extends string
    ? StringFilterOperators
    : VALUETYPE extends number
    ? NumberFilterOperators
    : VALUETYPE extends Date
    ? DateFilterOperators
    : never;

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

export type QueryFilter<T> =
    | {
          field: FilterString<T, boolean>;
          operator: FilterOperators<boolean>;
          value: boolean;
      }
    | {
          field: FilterString<T, string>;
          operator: FilterOperators<string>;
          value: string;
          ignoreCase?: boolean;
      }
    | {
          field: FilterString<T, Date>;
          operator: FilterOperators<Date>;
          value: Date;
      }
    | {
          field: FilterString<T, Guid>;
          operator: FilterOperators<Guid>;
          value: Guid;
          removeQuotes?: boolean;
      }
    | {
          field: FilterString<T, number>;
          operator: FilterOperators<number>;
          value: number;
      };

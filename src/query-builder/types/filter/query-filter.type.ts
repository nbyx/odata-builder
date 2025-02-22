import { Guid } from '../utils/util.types';

export type QueryFilter<T> = { lambdaOperator?: 'any' | 'all' } & (
    | {
          field: FilterFields<T, boolean>;
          operator: FilterOperators<boolean>;
          value: boolean | null;
          innerField?: LambdaFilterFields<T, boolean>;
      }
    | {
          field: FilterFields<T, string>;
          operator: FilterOperators<string>;
          value: string | null;
          ignoreCase?: boolean;
          innerField?: LambdaFilterFields<T, string>;
          removeQuotes?: boolean;
      }
    | {
          field: FilterFields<T, Date>;
          operator: FilterOperators<Date>;
          value: Date;
          innerField?: LambdaFilterFields<T, Date>;
      }
    | {
          field: FilterFields<T, Guid>;
          operator: FilterOperators<Guid>;
          value: Guid | null;
          removeQuotes?: boolean;
          innerField?: LambdaFilterFields<T, Guid>;
      }
    | {
          field: FilterFields<T, number>;
          operator: FilterOperators<number>;
          value: number | null;
          innerField?: LambdaFilterFields<T, number>;
      }
);

export type FilterFields<T, VALUETYPE> = {
    [K in Extract<keyof T, string>]: T[K] extends Record<string, unknown>
        ? T[K] extends VALUETYPE
            ? K
            : `${K}/${NestedFilterFields<T[K], VALUETYPE>}`
        : T[K] extends VALUETYPE | null | undefined
          ? K
          : T[K] extends readonly VALUETYPE[]
            ? K
            : T[K] extends readonly Record<string, infer INNERVALUE>[]
              ? INNERVALUE extends VALUETYPE
                  ? K
                  : never
              : never;
}[Extract<keyof T, string>];

type NestedFilterFieldsHelper<T, VALUETYPE> =
    T extends Record<string, unknown>
        ? {
              [K in keyof T & string]: T[K] extends VALUETYPE | null | undefined
                  ? K
                  : T[K] extends Record<string, unknown>
                    ? `${K}/${NestedFilterFieldsHelper<Exclude<T[K], undefined>, VALUETYPE>}` extends `${infer P}`
                        ? P
                        : never
                    : never;
          }[keyof T & string]
        : never;

export type NestedFilterFields<T, VALUETYPE> = NestedFilterFieldsHelper<
    T,
    VALUETYPE
>;
export type LambdaFilterFields<T, VALUETYPE> = {
    [K in Extract<keyof T, string>]: T[K] extends readonly (infer TYPE)[]
        ? TYPE extends object // Nur Arrays von Objekten
            ? {
                  [Key in keyof TYPE]: TYPE[Key] extends VALUETYPE
                      ? Key
                      : never;
              }[keyof TYPE] // Extrahiere nur Felder mit VALUETYPE
            : never
        : never;
}[Extract<keyof T, string>];

export type GeneralFilterOperators = 'eq' | 'ne';

export type StringFilterOperators = 'contains' | 'startswith' | 'endswith';

export type NumberFilterOperators = 'ge' | 'gt' | 'le' | 'lt';

type DateFilterOperators = NumberFilterOperators;

export type DateFilterFunctions =
    | 'day'
    | 'hour'
    | 'minute'
    | 'month'
    | 'second'
    | 'year';

export type MathFilterFunctions = 'round' | 'floor' | 'ceiling';

export type DependentFilterOperators<VALUETYPE> = VALUETYPE extends string
    ? StringFilterOperators
    : VALUETYPE extends number
      ? NumberFilterOperators
      : VALUETYPE extends Date
        ? DateFilterOperators
        : never;

export type FilterOperators<VALUETYPE> =
    | GeneralFilterOperators
    | DependentFilterOperators<VALUETYPE>;

import { Guid } from '../utils/util.types';
import { CombinedFilter } from './combined-filter.type';

export type QueryFilter<T> =
    | {
          field: FilterFields<T, boolean>;
          operator: FilterOperators<boolean>;
          value: boolean | null;
      }
    | {
          field: FilterFields<T, string>;
          operator: FilterOperators<string>;
          value: string | null;
          ignoreCase?: boolean;
          removeQuotes?: boolean;
          transform?: StringTransform[];
      }
    | {
          field: FilterFields<T, Date>;
          operator: FilterOperators<Date>;
          value: Date | null;
          transform?: DateTransform[];
      }
    | {
          field: FilterFields<T, Guid>;
          operator: FilterOperators<Guid>;
          value: Guid | null;
          removeQuotes?: boolean;
          transform?: GuidTransform[];
      }
    | {
          field: FilterFields<T, number>;
          operator: FilterOperators<number>;
          value: number | null;
          transform?: NumberTransform[];
      }
    | {
          [K in ArrayFields<T>]: {
              field: K;
              lambdaOperator: 'any' | 'all';
              expression:
                  | CombinedFilter<ArrayElement<T, K>>
                  | QueryFilter<ArrayElement<T, K>>;
          };
      }[ArrayFields<T>];

export type ArrayFields<T> = {
    [K in keyof T]: T[K] extends Array<unknown> ? K : never;
}[keyof T];

export type ArrayElement<T, K extends ArrayFields<T>> = T[K] extends (infer U)[]
    ? U
    : never;

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

export type StringFilterOperators =
    | 'contains'
    | 'startswith'
    | 'endswith'
    | 'substringof'
    | 'indexof'
    | 'concat';

export type StringTransform = 'tolower' | 'toupper' | 'trim' | 'length';
export type DateTransform =
    | 'year'
    | 'month'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second';
export type NumberTransform = 'round' | 'floor' | 'ceiling';
export type GuidTransform = 'tolower';

export type NumberFilterOperators = 'ge' | 'gt' | 'le' | 'lt';

type DateFilterOperators = NumberFilterOperators;

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

export interface FilterVisitor<T> {
    visitQueryFilter(filter: QueryFilter<T>): string;
    visitCombinedFilter(filter: CombinedFilter<T>): string;
}

import { Guid } from './util.types';

type GeneralFilterOperators = 'eq' | 'ne';

type StringFilterOperators = 'contains' | 'startswith' | 'endswith';

type NumberFilterOperators = 'ge' | 'gt' | 'le' | 'lt';

type DateFilterFunctions =
    | 'day'
    | 'hour'
    | 'minute'
    | 'month'
    | 'second'
    | 'year';

type MathFilterFunctions = 'round' | 'floor' | 'ceiling';

type DependentFilterOperators<VALUETYPE> = VALUETYPE extends string
    ? StringFilterOperators
    : VALUETYPE extends number
    ? NumberFilterOperators
    : never;

type FilterOperators<VALUETYPE> =
    | GeneralFilterOperators
    | DependentFilterOperators<VALUETYPE>;

type FilterFields<T, VALUETYPE> = {
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
          field: FilterFields<T, boolean>;
          operator: FilterOperators<boolean>;
          value: boolean;
      }
    | {
          field: FilterFields<T, string>;
          operator: FilterOperators<string>;
          value: string;
          ignoreCase?: boolean;
      }
    | {
          field: FilterFields<T, Date>;
          operator: FilterOperators<Date>;
          value: Date;
      }
    | {
          field: FilterFields<T, Guid>;
          operator: FilterOperators<Guid>;
          value: Guid;
          removeQuotes?: boolean;
      }
    | {
          field: FilterFields<T, number>;
          operator: FilterOperators<number>;
          value: number;
      };

type VerifyFilter<
    TYPE,
    FILTERFUNCTIONS,
    FILTERSTRING,
    OPERATOR,
    FIELD,
    VALUE,
    VALUETYPE,
    SECONDOPERATOR = GeneralFilterOperators,
> = OPERATOR extends FILTERFUNCTIONS
    ? FIELD extends FilterFields<TYPE, VALUETYPE>
        ? VALUE extends VALUETYPE
            ? SECONDOPERATOR extends GeneralFilterOperators
                ? FILTERSTRING
                : 'Second operator is not correct'
            : `Typeof value is not correct`
        : 'Field does not exists on type'
    : 'Operator is not valid';

export type FilterString<
    TYPE,
    FILTERSTRING extends string,
> = FILTERSTRING extends `${infer OPERATOR}(${infer FIELD}, '${infer VALUE}')`
    ? VerifyFilter<
          TYPE,
          StringFilterOperators,
          FILTERSTRING,
          OPERATOR,
          FIELD,
          VALUE,
          string
      >
    : FILTERSTRING extends `${infer FIELD} ${infer OPERATOR} '${infer VALUE}'`
    ? VerifyFilter<
          TYPE,
          FilterOperators<number | string>,
          FILTERSTRING,
          OPERATOR,
          FIELD,
          VALUE,
          string | number
      >
    : FILTERSTRING extends `${infer FIELD} ${infer OPERATOR} ${infer VALUE}`
    ? VerifyFilter<
          TYPE,
          FilterOperators<boolean>,
          FILTERSTRING,
          OPERATOR,
          FIELD,
          VALUE,
          boolean
      >
    : FILTERSTRING extends `${infer OPERATOR}(${infer FIELD}) ${infer SECONDOPERATOR} ${infer VALUE}`
    ? VerifyFilter<
          TYPE,
          DateFilterFunctions | MathFilterFunctions,
          FILTERSTRING,
          OPERATOR,
          FIELD,
          VALUE,
          Date | number,
          SECONDOPERATOR
      >
    : never;

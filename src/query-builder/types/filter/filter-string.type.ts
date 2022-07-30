import {
    DateFilterFunctions,
    FilterFields,
    FilterOperators,
    GeneralFilterOperators,
    MathFilterFunctions,
    StringFilterOperators,
} from './query-filter.type';

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

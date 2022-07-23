export type ODataOperators =
    | 'filter'
    | 'count'
    | 'top'
    | 'skip'
    | 'select'
    | 'expand'
    | 'orderby'
    | 'search';

export type OperatorQueryFn = () => string;

export type OperatorOrder = { [key in ODataOperators]: OperatorQueryFn };

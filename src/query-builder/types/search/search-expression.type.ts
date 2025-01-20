export type SearchTerm = string & { __type: 'SearchTerm' };

export interface SearchPhrase {
    phrase: string;
}

export type SearchOperator = 'AND' | 'OR' | 'NOT';

export interface SearchGroup {
    expression: SearchExpression;
}

export type SearchExpressionPart =
    | SearchTerm
    | SearchPhrase
    | SearchOperator
    | SearchGroup;

export type SearchExpression = readonly SearchExpressionPart[];

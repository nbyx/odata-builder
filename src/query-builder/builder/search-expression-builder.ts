import {
    SearchExpression,
    SearchExpressionPart,
} from '../types/search/search-expression.type';
import { createSearchTerm } from '../utils/search/search.utils';

export class SearchExpressionBuilder {
    private readonly parts: ReadonlyArray<SearchExpressionPart>;

    constructor(parts: SearchExpression = []) {
        this.parts = parts;
    }

    term(term: string): SearchExpressionBuilder {
        if (!term.trim()) {
            throw new Error('Term cannot be empty or whitespace only.');
        }
        return new SearchExpressionBuilder([
            ...this.parts,
            createSearchTerm(term),
        ]);
    }

    phrase(phrase: string): SearchExpressionBuilder {
        if (!phrase.trim()) {
            throw new Error('Phrase cannot be empty or whitespace only.');
        }
        return new SearchExpressionBuilder([...this.parts, { phrase }]);
    }

    and(): SearchExpressionBuilder {
        return new SearchExpressionBuilder([...this.parts, 'AND']);
    }

    or(): SearchExpressionBuilder {
        return new SearchExpressionBuilder([...this.parts, 'OR']);
    }

    not(expressionBuilder: SearchExpressionBuilder): SearchExpressionBuilder {
        return new SearchExpressionBuilder([
            ...this.parts,
            { expression: [`NOT`, ...expressionBuilder.build()] },
        ]);
    }

    group(builder: SearchExpressionBuilder): SearchExpressionBuilder {
        return new SearchExpressionBuilder([
            ...this.parts,
            { expression: builder.build() },
        ]);
    }

    build(): SearchExpression {
        return this.parts;
    }

    toString(): string {
        return this.parts.map(this.stringifyPart.bind(this)).join(' ');
    }

    equals(other: SearchExpressionBuilder): boolean {
        return JSON.stringify(this.build()) === JSON.stringify(other.build());
    }

    private stringifyPart(part: SearchExpressionPart): string {
        if (typeof part === 'string') {
            return part;
        }
        if ('phrase' in part) {
            return `"${part.phrase}"`;
        }
        if ('expression' in part) {
            const expression = part.expression
                .map(this.stringifyPart.bind(this))
                .join(' ');
            return `(${expression})`;
        }
        throw new Error(
            `Unsupported SearchExpressionPart: ${JSON.stringify(part)}`,
        );
    }
}

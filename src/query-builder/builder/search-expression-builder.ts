import {
    SearchExpression,
    SearchExpressionPart,
    SearchGroup,
} from '../types/search/search-expression.type';
import { createSearchTerm } from '../utils/search/search.utils';

export class SearchExpressionBuilder {
    private readonly parts: ReadonlyArray<SearchExpressionPart>;

    constructor(parts: SearchExpression = []) {
        this.parts = Object.freeze(Array.isArray(parts) ? [...parts] : []);
    }

    public term(value: string): SearchExpressionBuilder {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            throw new Error('Term cannot be empty or whitespace only.');
        }
        return new SearchExpressionBuilder([
            ...this.parts,
            createSearchTerm(trimmedValue),
        ]);
    }

    public phrase(value: string): SearchExpressionBuilder {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            throw new Error('Phrase cannot be empty or whitespace only.');
        }
        return new SearchExpressionBuilder([
            ...this.parts,
            { phrase: trimmedValue },
        ]);
    }

    public and(): SearchExpressionBuilder {
        if (this.parts.length === 0) {
            console.warn(
                'Attempted to start an expression with AND. Operation skipped.',
            );
            return this;
        }
        const lastPart = this.parts[this.parts.length - 1];
        if (
            typeof lastPart === 'string' &&
            (lastPart === 'AND' || lastPart === 'OR')
        ) {
            console.warn(
                `Attempted to add AND after operator '${lastPart}'. Operation skipped.`,
            );
            return this;
        }
        return new SearchExpressionBuilder([...this.parts, 'AND']);
    }

    public or(): SearchExpressionBuilder {
        if (this.parts.length === 0) {
            console.warn(
                'Attempted to start an expression with OR. Operation skipped.',
            );
            return this;
        }
        const lastPart = this.parts[this.parts.length - 1];
        if (
            typeof lastPart === 'string' &&
            (lastPart === 'AND' || lastPart === 'OR')
        ) {
            console.warn(
                `Attempted to add OR after operator '${lastPart}'. Operation skipped.`,
            );
            return this;
        }
        return new SearchExpressionBuilder([...this.parts, 'OR']);
    }

    public not(
        expressionBuilder: SearchExpressionBuilder,
    ): SearchExpressionBuilder {
        const subExpression = expressionBuilder.build();
        if (subExpression.length === 0) {
            throw new Error(
                'NOT operator cannot be applied to an empty expression.',
            );
        }
        return new SearchExpressionBuilder([
            ...this.parts,

            { expression: Object.freeze(['NOT' as const, ...subExpression]) },
        ]);
    }

    public group(builder: SearchExpressionBuilder): SearchExpressionBuilder {
        const subExpression = builder.build();
        if (subExpression.length === 0) {
            return this;
        }
        return new SearchExpressionBuilder([
            ...this.parts,
            { expression: subExpression },
        ]);
    }

    public build(): SearchExpression {
        return this.parts;
    }

    public toString(): string {
        return this.parts
            .map(part => this.stringifyPart(part))
            .filter(Boolean)
            .join(' ');
    }

    public equals(other: SearchExpressionBuilder): boolean {
        return JSON.stringify(this.build()) === JSON.stringify(other.build());
    }

    private stringifyPart(part: SearchExpressionPart): string {
        if (typeof part === 'string') {
            return part;
        }
        if ('phrase' in part && part.phrase !== undefined) {
            return `"${part.phrase}"`;
        }

        if ('expression' in part && Array.isArray(part.expression)) {
            const groupExpressionParts = part.expression;
            if (groupExpressionParts.length === 0) {
                return '';
            }

            if (groupExpressionParts[0] === 'NOT') {
                const exprToNegate = groupExpressionParts.slice(1);
                if (exprToNegate.length === 0) {
                    throw new Error(
                        'Invalid NOT expression: NOT must be followed by a term or group.',
                    );
                }

                const stringifiedSubExpression = exprToNegate
                    .map(p => this.stringifyPart(p))
                    .filter(Boolean)
                    .join(' ');

                if (stringifiedSubExpression === '') {
                    throw new Error(
                        'Invalid NOT expression: expression to negate is empty after stringification.',
                    );
                }

                if (
                    stringifiedSubExpression.startsWith('(') &&
                    stringifiedSubExpression.endsWith(')')
                ) {
                    return `NOT ${stringifiedSubExpression}`;
                } else {
                    return `NOT (${stringifiedSubExpression})`;
                }
            }

            const expressionString = groupExpressionParts
                .map(p => this.stringifyPart(p))
                .filter(Boolean)
                .join(' ');

            if (expressionString === '') return '';
            return `(${expressionString})`;
        }

        throw new Error(
            `Unsupported SearchExpressionPart: ${JSON.stringify(part)}`,
        );
    }
}

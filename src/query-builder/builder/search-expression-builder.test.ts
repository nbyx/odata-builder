import { describe, it, expect } from 'vitest';
import { SearchExpressionBuilder } from './search-expression-builder';
import { SearchExpressionPart } from '../types/search/search-expression.type';

describe('SearchExpressionBuilder', () => {
    it('should add a term to the expression', () => {
        const builder = new SearchExpressionBuilder().term('example');
        expect(builder.toString()).toBe('example');
    });

    it('should add a phrase to the expression', () => {
        const builder = new SearchExpressionBuilder().phrase('example phrase');
        expect(builder.toString()).toBe('"example phrase"');
    });

    it('should combine terms with AND', () => {
        const builder = new SearchExpressionBuilder()
            .term('first')
            .and()
            .term('second');
        expect(builder.toString()).toBe('first AND second');
    });

    it('should combine terms with OR', () => {
        const builder = new SearchExpressionBuilder()
            .term('first')
            .or()
            .term('second');
        expect(builder.toString()).toBe('first OR second');
    });

    it('should handle NOT operator', () => {
        const builder = new SearchExpressionBuilder().not(
            new SearchExpressionBuilder().term('excluded'),
        );
        expect(builder.toString()).toBe('(NOT excluded)');
    });

    it('should handle grouped expressions', () => {
        const builder = new SearchExpressionBuilder().group(
            new SearchExpressionBuilder().term('red').and().term('blue'),
        );
        expect(builder.toString()).toBe('(red AND blue)');
    });

    it('should handle deeply nested expressions', () => {
        const builder = new SearchExpressionBuilder()
            .term('outer')
            .and()
            .group(
                new SearchExpressionBuilder()
                    .term('inner1')
                    .or()
                    .not(new SearchExpressionBuilder().term('inner2')),
            );
        expect(builder.toString()).toBe('outer AND (inner1 OR (NOT inner2))');
    });

    it('should handle empty builder gracefully', () => {
        const builder = new SearchExpressionBuilder();
        expect(builder.toString()).toBe('');
    });

    it('should validate empty term input', () => {
        expect(() => new SearchExpressionBuilder().term('')).toThrowError(
            'Term cannot be empty or whitespace only.',
        );
    });

    it('should validate empty phrase input', () => {
        expect(() => new SearchExpressionBuilder().phrase('')).toThrowError(
            'Phrase cannot be empty or whitespace only.',
        );
    });

    it('should compare equality of builders', () => {
        const builder1 = new SearchExpressionBuilder()
            .term('first')
            .and()
            .term('second');
        const builder2 = new SearchExpressionBuilder()
            .term('first')
            .and()
            .term('second');
        expect(builder1.equals(builder2)).toBe(true);
    });

    it('should detect inequality between builders', () => {
        const builder1 = new SearchExpressionBuilder().term('first');
        const builder2 = new SearchExpressionBuilder().term('second');
        expect(builder1.equals(builder2)).toBe(false);
    });

    it('should throw an error for unsupported SearchExpressionPart', () => {
        const invalidPart = { invalidKey: 'invalidValue' };
        const builder = new SearchExpressionBuilder(
            [invalidPart as unknown as SearchExpressionPart],
        );

        expect(() => builder.toString()).toThrowError(
            `Unsupported SearchExpressionPart: ${JSON.stringify(invalidPart)}`,
        );
    });
});

export const toSkipQuery = (skip: number): string => {
    if (skip < 0) throw new Error('Invalid skip count');
    if (skip === 0) return '';

    return `$skip=${skip}`;
};

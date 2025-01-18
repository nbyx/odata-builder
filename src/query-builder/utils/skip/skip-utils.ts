export const toSkipQuery = (skip: number): string => {
    if (!Number.isFinite(skip) || !Number.isInteger(skip) || skip < 0) {
        throw new Error('Invalid skip count');
    }
    if (skip === 0) return '';

    return `$skip=${skip}`;
};

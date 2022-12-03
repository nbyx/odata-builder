export const toTopQuery = (top: number): string => {
    if (top < 0) throw new Error('Invalid top count');
    if (top === 0) return '';

    return `$top=${top}`;
};

export function toSelectQuery(select: string[]): string {
    return `$select=${select.join(', ')}`;
}

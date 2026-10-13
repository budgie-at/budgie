export const buildPrefixLikeSql = (column: string, prefixes: readonly string[]): string =>
    `(${prefixes.map(prefix => `${column} LIKE '${prefix}%'`).join(' OR ')})`;

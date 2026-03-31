export const escapeSqlLikeValue = (value: string): string => value.replace(/\\/gu, '\\\\').replace(/%/gu, '\\%').replace(/_/gu, '\\_');

export const getSyncRowKey = (tableName: string, syncId: string): string => `${tableName}|${syncId}`;

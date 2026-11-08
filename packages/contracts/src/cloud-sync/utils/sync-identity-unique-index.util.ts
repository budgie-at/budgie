import { uniqueIndex } from 'drizzle-orm/sqlite-core';

import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export const syncIdentityUniqueIndex = (tableName: string, table: { syncZone: AnySQLiteColumn; syncId: AnySQLiteColumn }) =>
    uniqueIndex(`${tableName}_sync_identity_unq`).on(table.syncZone, table.syncId);

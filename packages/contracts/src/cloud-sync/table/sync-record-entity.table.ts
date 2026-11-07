import { int, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';

export const SyncRecordEntityTable = sqliteTable(
    'sync_record',
    {
        syncZone: text('sync_zone').notNull(),
        syncId: text('sync_id').notNull(),
        recordType: text('record_type').notNull(),
        systemFields: text('system_fields'),
        payload: text('payload'),
        schemaVersion: int('schema_version', { mode: 'number' }).notNull().default(1),
        updatedAt: int('updated_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP)
    },
    table => [primaryKey({ columns: [table.syncZone, table.syncId] })]
);

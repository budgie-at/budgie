import { index, int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';

export const SyncPendingEntityTable = sqliteTable(
    'sync_pending',
    {
        id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
        syncZone: text('sync_zone').notNull(),
        syncId: text('sync_id').notNull(),
        recordType: text('record_type').notNull(),
        missingRecordType: text('missing_record_type').notNull(),
        missingSyncId: text('missing_sync_id').notNull(),
        systemFields: text('system_fields'),
        payload: text('payload').notNull(),
        createdAt: int('created_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP)
    },
    table => [
        uniqueIndex('sync_pending_record_unq').on(table.syncZone, table.syncId),
        index('sync_pending_missing_idx').on(table.syncZone, table.missingSyncId)
    ]
);

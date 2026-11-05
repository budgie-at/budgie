import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';
import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { SyncOutboxOperationEnum } from '../enum/sync-outbox-operation.enum';

export const SyncOutboxEntityTable = sqliteTable(
    'sync_outbox',
    {
        id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
        recordType: text('record_type').notNull(),
        syncZone: text('sync_zone').notNull(),
        syncId: text('sync_id').notNull(),
        operation: text('operation', { enum: convertEnumToDrizzleEnum(SyncOutboxOperationEnum) })
            .$type<SyncOutboxOperationEnum>()
            .notNull()
            .default(SyncOutboxOperationEnum.SAVE),
        changedColumns: text('changed_columns').notNull().default('[]'),
        syncRevision: int('sync_revision', { mode: 'number' }).notNull().default(1),
        createdAt: int('created_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP)
    },
    table => [uniqueIndex('sync_outbox_record_unq').on(table.syncZone, table.syncId)]
);

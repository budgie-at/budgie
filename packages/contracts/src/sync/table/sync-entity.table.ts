import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { SyncModeEnum } from '../enum/sync-mode.enum';
import { SyncStatusEnum } from '../enum/sync-status.enum';

export const SyncEntityTable = sqliteTable(
    'bank_syncs',
    withBaseEntityTableColumns({
        accountId: int('account_id', { mode: 'number' })
            .notNull()
            .unique()
            .references(() => AccountEntityTable.id, { onDelete: 'cascade' }),
        provider: text('provider', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) })
            .$type<ExternalSourceEnum>()
            .notNull(),
        enabled: int('enabled', { mode: 'boolean' }).default(true).notNull(),
        mode: text('mode', { enum: convertEnumToDrizzleEnum(SyncModeEnum) })
            .$type<SyncModeEnum>()
            .default(SyncModeEnum.BACKWARD)
            .notNull(),
        status: text('status', { enum: convertEnumToDrizzleEnum(SyncStatusEnum) })
            .$type<SyncStatusEnum>()
            .default(SyncStatusEnum.IDLE)
            .notNull(),
        backwardSyncedAt: int('backward_synced_at', { mode: 'timestamp' }),
        backwardSyncFromAt: int('backward_sync_from_at', { mode: 'timestamp' }),
        forwardSyncedAt: int('forward_synced_at', { mode: 'timestamp' }),
        forwardSyncFromAt: int('forward_sync_from_at', { mode: 'timestamp' }),
        transactionCount: int('transaction_count', { mode: 'number' }).default(0).notNull(),
        errorCount: int('error_count', { mode: 'number' }).default(0).notNull(),
        lastError: text('last_error')
    })
);

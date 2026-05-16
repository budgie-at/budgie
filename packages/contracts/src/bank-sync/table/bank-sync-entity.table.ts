import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankSyncModeEnum } from '../enum/bank-sync-mode.enum';
import { BankSyncStatusEnum } from '../enum/bank-sync-status.enum';

export const BankSyncEntityTable = sqliteTable(
    'bank_syncs',
    withBaseEntityTableColumns({
        accountId: int('account_id', { mode: 'number' })
            .notNull()
            .unique()
            .references(() => AccountEntityTable.id, { onDelete: 'cascade' }),
        provider: text('provider', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) })
            .$type<ExternalSourceEnum>()
            .notNull(),
        token: text('token').notNull(),
        enabled: int('enabled', { mode: 'boolean' }).default(true).notNull(),
        applyMccDefaultCategory: int('apply_mcc_default_category', { mode: 'boolean' }).default(true).notNull(),
        mode: text('mode', { enum: convertEnumToDrizzleEnum(BankSyncModeEnum) })
            .$type<BankSyncModeEnum>()
            .default(BankSyncModeEnum.BACKWARD)
            .notNull(),
        status: text('status', { enum: convertEnumToDrizzleEnum(BankSyncStatusEnum) })
            .$type<BankSyncStatusEnum>()
            .default(BankSyncStatusEnum.IDLE)
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

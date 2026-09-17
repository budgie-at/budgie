import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { SyncBalanceAuthorityEnum } from '../enum/sync-balance-authority.enum';
import { SyncModeEnum } from '../enum/sync-mode.enum';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncWarningEnum } from '../enum/sync-warning.enum';

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
        backwardSyncLimitAt: int('backward_sync_limit_at', { mode: 'timestamp' }),
        backwardBatchAt: int('backward_batch_at', { mode: 'timestamp_ms' }),
        forwardSyncedAt: int('forward_synced_at', { mode: 'timestamp' }),
        forwardSyncFromAt: int('forward_sync_from_at', { mode: 'timestamp' }),
        balanceAuthority: text('balance_authority', { enum: convertEnumToDrizzleEnum(SyncBalanceAuthorityEnum) })
            .$type<SyncBalanceAuthorityEnum>()
            .default(SyncBalanceAuthorityEnum.LEDGER)
            .notNull(),
        balanceAdjustmentTransactionId: int('balance_adjustment_transaction_id', { mode: 'number' }),
        transactionCount: int('transaction_count', { mode: 'number' }).default(0).notNull(),
        errorCount: int('error_count', { mode: 'number' }).default(0).notNull(),
        lastError: text('last_error'),
        lastWarning: text('last_warning', { enum: convertEnumToDrizzleEnum(SyncWarningEnum) }).$type<SyncWarningEnum>(),
        binanceTradeCursor: text('binance_trade_cursor')
    })
);

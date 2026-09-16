import { createSelectSchema } from 'drizzle-zod';
import { number, enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { SyncBalanceAuthorityEnum } from '../enum/sync-balance-authority.enum';
import { SyncModeEnum } from '../enum/sync-mode.enum';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncWarningEnum } from '../enum/sync-warning.enum';
import { SyncEntityTable } from '../table/sync-entity.table';

export const SyncEntitySchema = createSelectSchema(SyncEntityTable, {
    ...BaseEntityFields,
    accountId: number().positive().describe('The id of the associated account.'),
    provider: zodEnum(ExternalSourceEnum).describe('The bank provider for synchronization.'),
    enabled: schema => schema.default(true).describe('Whether sync is enabled for this account.'),
    mode: zodEnum(SyncModeEnum).describe('Current sync mode (forward or backward).'),
    status: zodEnum(SyncStatusEnum).describe('Current sync status.'),
    backwardSyncedAt: schema => schema.nullable().default(null).describe('Timestamp when backward sync was completed.'),
    backwardSyncFromAt: schema => schema.nullable().default(null).describe('Timestamp to sync backward from (newest point going back).'),
    backwardSyncLimitAt: schema =>
        schema.nullable().default(null).describe('Earliest point backward sync should reach; null backfills the whole available history.'),
    backwardBatchSequence: schema => schema.nullable().default(null).describe('Round-robin sequence of the latest backward sync batch.'),
    forwardSyncedAt: schema => schema.nullable().default(null).describe('Timestamp of the last successful forward sync.'),
    forwardSyncFromAt: schema => schema.nullable().default(null).describe('Timestamp to sync forward from.'),
    balanceAuthority: zodEnum(SyncBalanceAuthorityEnum)
        .default(SyncBalanceAuthorityEnum.LEDGER)
        .describe('Whether the current balance comes from the ledger or a provider snapshot.'),
    balanceAnchorCapturedAt: schema => schema.nullable().default(null).describe('Timestamp when the provider balance anchor was captured.'),
    balanceAdjustmentTransactionId: schema =>
        schema.nullable().default(null).describe('Transaction used to reconcile the ledger to the provider balance.'),
    transactionCount: number().nonnegative().default(0).describe('Total number of transactions synced.'),
    errorCount: number().nonnegative().default(0).describe('Number of consecutive sync errors.'),
    lastError: schema => schema.nullable().default(null).describe('Last error message if sync failed.'),
    lastWarning: zodEnum(SyncWarningEnum)
        .nullable()
        .default(null)
        .describe('Last non-fatal sync warning, such as a missing provider read scope.'),
    binanceTradeCursor: schema =>
        schema
            .nullable()
            .default(null)
            .describe('JSON-encoded per-symbol Binance trade fromId cursor map, used to resume paging across sync runs.')
});

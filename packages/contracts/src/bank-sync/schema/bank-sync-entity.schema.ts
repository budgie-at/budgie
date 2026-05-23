import { createSelectSchema } from 'drizzle-zod';
import { number, string, enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { BankSyncModeEnum } from '../enum/bank-sync-mode.enum';
import { BankSyncStatusEnum } from '../enum/bank-sync-status.enum';
import { BankSyncEntityTable } from '../table/bank-sync-entity.table';

export const BankSyncEntitySchema = createSelectSchema(BankSyncEntityTable, {
    ...BaseEntityFields,
    accountId: number().positive().describe('The id of the associated account.'),
    provider: zodEnum(ExternalSourceEnum).describe('The bank provider for synchronization.'),
    token: string().min(1).describe('API token for this bank account sync.'),
    enabled: schema => schema.default(true).describe('Whether sync is enabled for this account.'),
    mode: zodEnum(BankSyncModeEnum).describe('Current sync mode (forward or backward).'),
    status: zodEnum(BankSyncStatusEnum).describe('Current sync status.'),
    backwardSyncedAt: schema =>
        schema
            .nullable()
            .default(null)
            .describe(
                'Transient streak anchor: the `from` of the first empty 31-day window in the current dormancy streak. Null when no empty streak is active.'
            ),
    backwardCompletedAt: schema =>
        schema
            .nullable()
            .default(null)
            .describe('Terminal completion timestamp: when the backward sweep finished (history exhausted or dormancy boundary reached).'),
    backwardSyncFromAt: schema => schema.nullable().default(null).describe('Timestamp to sync backward from (newest point going back).'),
    forwardSyncedAt: schema => schema.nullable().default(null).describe('Timestamp of the last successful forward sync.'),
    forwardSyncFromAt: schema => schema.nullable().default(null).describe('Timestamp to sync forward from.'),
    transactionCount: number().nonnegative().default(0).describe('Total number of transactions synced.'),
    errorCount: number().nonnegative().default(0).describe('Number of consecutive sync errors.'),
    lastError: schema => schema.nullable().default(null).describe('Last error message if sync failed.')
});

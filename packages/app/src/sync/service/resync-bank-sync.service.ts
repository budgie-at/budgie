import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { bankSyncRepository, db, transactionRepository } from '../../@generic/drizzle/db/db';
import { unconsolidateByIdInTransaction } from '../../transaction/utils/unconsolidate-by-id-in-transaction.util';

import type { DB } from '@budgie/contracts';
import type { ResyncBankSyncInputInterface } from '../interface/resync-bank-sync-input.interface';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

class ResyncBankSyncService {
    @Log(
        input => `enter accountId=${input.accountId} sinceDays=${String(input.sinceDays)}`,
        (_, input) => `done accountId=${input.accountId} sinceDays=${String(input.sinceDays)}`,
        (error, input) => `throw accountId=${input.accountId} sinceDays=${String(input.sinceDays)} error=${getErrorMessage(error)}`
    )
    async resync(input: ResyncBankSyncInputInterface): Promise<void> {
        await transactionAsync(db, async tx => {
            if (isDefined(input.sinceDays)) {
                await this.resyncWindowed(input.accountId, input.sinceDays, tx);
            } else {
                await this.resyncFull(input.accountId, tx);
            }
        });
    }

    private async resyncFull(accountId: number, tx: DB): Promise<void> {
        const canonicals = await transactionRepository.findActiveAutoConsolidatedByAccountIds([accountId], tx);
        for (const canonical of canonicals) {
            // eslint-disable-next-line no-await-in-loop -- Sequential unconsolidation must precede the resync reset
            await unconsolidateByIdInTransaction(canonical.id, tx);
        }
        await bankSyncRepository.resetForResync(accountId, tx);
    }

    private async resyncWindowed(accountId: number, sinceDays: number, tx: DB): Promise<void> {
        const since = new Date(Date.now() - sinceDays * MILLISECONDS_PER_DAY);
        const canonicals = await transactionRepository.findActiveAutoConsolidatedByAccountIdsSince([accountId], since, tx);
        for (const canonical of canonicals) {
            // eslint-disable-next-line no-await-in-loop -- Sequential unconsolidation must precede the resync reset
            await unconsolidateByIdInTransaction(canonical.id, tx);
        }
        await bankSyncRepository.resetForWindowedResync(accountId, since, tx);
    }
}

export const resyncBankSyncService = new ResyncBankSyncService();

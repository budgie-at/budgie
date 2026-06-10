import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { db, syncRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { unconsolidateByIdInTransaction } from '../../transaction/utils/unconsolidate-by-id-in-transaction.util';

import { monobankSyncService } from './monobank-sync.service';
import { syncWorkloadService } from './sync-workload.service';

import type { ResyncInputInterface } from '../interface/resync-input.interface';
import type { DB, TransactionEntityInterface } from '@budgie/contracts';

class ResyncService {
    private static readonly MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
    private static readonly YIELD_EVERY_ROWS = 5;

    @Log(
        input => `enter accountId=${input.accountId} sinceDays=${String(input.sinceDays)}`,
        (_, input) => `done accountId=${input.accountId} sinceDays=${String(input.sinceDays)}`,
        (error, input) => `throw accountId=${input.accountId} sinceDays=${String(input.sinceDays)} error=${getErrorMessage(error)}`
    )
    async resync(input: ResyncInputInterface): Promise<void> {
        await transactionAsync(db, async tx => {
            if (isDefined(input.sinceDays)) {
                await this.resyncWindowed(input.accountId, input.sinceDays, tx);
            } else {
                await this.resyncFull(input.accountId, tx);
            }
        });

        syncWorkloadService.run('manual-monobank-resync', () => monobankSyncService.sync()).catch(emptyFn);
    }

    private async resyncFull(accountId: number, tx: DB): Promise<void> {
        const canonicals = await transactionRepository.findActiveAutoConsolidatedByAccountIds([accountId], tx);
        await this.unconsolidateCanonicals(canonicals, tx);
        await syncRepository.resetForResync(accountId, tx);
    }

    private async resyncWindowed(accountId: number, sinceDays: number, tx: DB): Promise<void> {
        const since = new Date(Date.now() - sinceDays * ResyncService.MILLISECONDS_PER_DAY);
        const canonicals = await transactionRepository.findActiveAutoConsolidatedByAccountIdsSince([accountId], since, tx);
        await this.unconsolidateCanonicals(canonicals, tx);
        await syncRepository.resetForWindowedResync(accountId, since, tx);
    }

    private async unconsolidateCanonicals(canonicals: Array<Pick<TransactionEntityInterface, 'id'>>, tx: DB, index = 0): Promise<void> {
        if (index >= canonicals.length) {
            return;
        }

        const batch = canonicals.slice(index, index + ResyncService.YIELD_EVERY_ROWS);
        await this.unconsolidateCanonicalBatch(batch, tx);

        if (index + ResyncService.YIELD_EVERY_ROWS < canonicals.length) {
            await microPause();
        }

        await this.unconsolidateCanonicals(canonicals, tx, index + ResyncService.YIELD_EVERY_ROWS);
    }

    private async unconsolidateCanonicalBatch(canonicals: Array<Pick<TransactionEntityInterface, 'id'>>, tx: DB): Promise<void> {
        const [canonical, ...remainingCanonicals] = canonicals;

        if (!isDefined(canonical)) {
            return;
        }

        await unconsolidateByIdInTransaction(canonical.id, tx);
        await this.unconsolidateCanonicalBatch(remainingCanonicals, tx);
    }
}

export const resyncService = new ResyncService();

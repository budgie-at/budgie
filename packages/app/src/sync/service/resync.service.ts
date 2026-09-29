import { Db, ExternalSourceEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { syncRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { Workload } from '../../@generic/service/workload.service';
import { unconsolidateByIdInTransaction } from '../../transaction/utils/unconsolidate-by-id-in-transaction.util';

import { monobankSyncService } from './monobank-sync.service';

import type { ResyncInputInterface } from '../interface/resync-input.interface';
import type { TransactionEntityInterface } from '@budgie/contracts';

class ResyncService {
    private static readonly MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
    private static readonly YIELD_EVERY_ROWS = 5;

    readonly resync = Effect.fn('ResyncService.resync')(function* (this: ResyncService, input: ResyncInputInterface) {
        const { accountId, sinceDays } = input;
        if (isDefined(sinceDays)) {
            yield* Db.transaction(this.resyncWindowed(accountId, sinceDays));
        } else {
            const sync = yield* syncRepository.getByAccountId(accountId);
            const setupBalance =
                sync?.provider === ExternalSourceEnum.MONOBANK ? yield* monobankSyncService.fetchSetupBalance(accountId) : null;
            yield* Db.transaction(this.resyncFull(accountId, setupBalance));
        }

        yield* Effect.forkDetach(Workload.use(workload => workload.run(monobankSyncService.sync())));
    });

    private readonly resyncFull = Effect.fnUntraced(function* (this: ResyncService, accountId: number, setupBalance: number | null) {
        const canonicals = yield* transactionRepository.findActiveAutoConsolidatedByAccountIds([accountId]);
        yield* this.unconsolidateCanonicals(canonicals);
        yield* syncRepository.resetForResync(accountId, setupBalance);
    });

    private readonly resyncWindowed = Effect.fnUntraced(function* (this: ResyncService, accountId: number, sinceDays: number) {
        const since = new Date(Date.now() - sinceDays * ResyncService.MILLISECONDS_PER_DAY);
        const canonicals = yield* transactionRepository.findActiveAutoConsolidatedByAccountIdsSince([accountId], since);
        yield* this.unconsolidateCanonicals(canonicals);
        yield* syncRepository.resetForWindowedResync(accountId, since);
    });

    private readonly unconsolidateCanonicals = Effect.fnUntraced(function* (canonicals: Array<Pick<TransactionEntityInterface, 'id'>>) {
        for (const [index, canonical] of canonicals.entries()) {
            yield* unconsolidateByIdInTransaction(canonical.id);

            if ((index + 1) % ResyncService.YIELD_EVERY_ROWS === 0 && index + 1 < canonicals.length) {
                yield* Effect.yieldNow;
            }
        }
    });
}

export const resyncService = new ResyncService();

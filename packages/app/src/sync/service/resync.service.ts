import { UnconsolidationService } from '@budgie/consolidation';
import { Db, ExternalSourceEnum, SyncRepository, TransactionConsolidationRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';

import { MonobankSyncService } from './monobank-sync.service';

import type { ResyncInputInterface } from '../interface/resync-input.interface';
import type { TransactionEntityInterface } from '@budgie/contracts';

export class ResyncService extends Context.Service<ResyncService>()('@budgie/app/ResyncService', {
    make: Effect.gen(function* () {
        const workload = yield* Workload;
        const syncRepository = yield* SyncRepository;
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const unconsolidationService = yield* UnconsolidationService;
        const monobankSyncService = yield* MonobankSyncService;
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const yieldEveryRows = 5;

        const unconsolidateCanonicals = Effect.fnUntraced(function* (canonicals: Array<Pick<TransactionEntityInterface, 'id'>>) {
            for (const [index, canonical] of canonicals.entries()) {
                yield* Db.transaction(unconsolidationService.unconsolidateById(canonical.id));

                if ((index + 1) % yieldEveryRows === 0 && index + 1 < canonicals.length) {
                    yield* Effect.yieldNow;
                }
            }
        });

        const resyncFull = Effect.fnUntraced(function* (accountId: number, setupBalance: number | null) {
            const canonicals = yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([accountId]);
            yield* unconsolidateCanonicals(canonicals);
            yield* syncRepository.resetForResync(accountId, setupBalance);
        });

        const resyncWindowed = Effect.fnUntraced(function* (accountId: number, sinceDays: number) {
            const since = new Date(Date.now() - sinceDays * millisecondsPerDay);
            const canonicals = yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIdsSince([accountId], since);
            yield* unconsolidateCanonicals(canonicals);
            yield* syncRepository.resetForWindowedResync(accountId, since);
        });

        return {
            resync: Effect.fn('ResyncService.resync')(function* (input: ResyncInputInterface) {
                const { accountId, sinceDays } = input;
                if (isDefined(sinceDays)) {
                    yield* Db.transaction(resyncWindowed(accountId, sinceDays));
                } else {
                    const sync = yield* syncRepository.getByAccountId(accountId);
                    const setupBalance =
                        sync?.provider === ExternalSourceEnum.MONOBANK ? yield* monobankSyncService.fetchSetupBalance(accountId) : null;
                    yield* Db.transaction(resyncFull(accountId, setupBalance));
                }

                yield* Effect.forkDetach(workload.run(monobankSyncService.sync()));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(ResyncService, ResyncService.make).pipe(
        Layer.provide([
            Workload.layer,
            SyncRepository.layer,
            TransactionConsolidationRepository.layer,
            UnconsolidationService.layer,
            MonobankSyncService.layer
        ])
    );
}

import { UnconsolidationService } from '@budgie/consolidation';
import { Db, ExternalSourceEnum, SyncRepository, TransactionConsolidationRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { MonobankSyncService } from '../../monobank/service/monobank-sync.service';

import { SyncProviderRegistryService } from './sync-provider-registry.service';

import type { ResyncInputInterface } from '../interface/resync-input.interface';
import type { TransactionEntityInterface } from '@budgie/contracts';

export class ResyncService extends Context.Service<ResyncService>()('@budgie/sync/ResyncService', {
    make: Effect.gen(function* () {
        const syncRepository = yield* SyncRepository;
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const unconsolidationService = yield* UnconsolidationService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transactionService = yield* TransactionService;
        const monobankSyncService = yield* MonobankSyncService;
        const syncProviderRegistryService = yield* SyncProviderRegistryService;
        const millisecondsPerDay = 24 * 60 * 60 * 1000;

        const unconsolidateCanonicals = Effect.fnUntraced(function* <E>(
            fetchCanonicals: Effect.Effect<readonly Pick<TransactionEntityInterface, 'id'>[], E, Db>
        ) {
            const { affectedAccountIds } = yield* unconsolidationService.unconsolidateAllNested(fetchCanonicals);

            if (isNotEmptyArray(affectedAccountIds)) {
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds(affectedAccountIds);
            }
        });

        const resyncFull = Effect.fnUntraced(function* (accountId: number, setupBalance: number | null) {
            yield* unconsolidateCanonicals(transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([accountId]));
            const reconciliationTransactionId = (yield* syncRepository.getByAccountId(accountId))?.reconciliationTransactionId;
            yield* syncRepository.resetForResync(accountId, setupBalance);
            if (isDefined(reconciliationTransactionId)) {
                yield* transactionService.purgeById(reconciliationTransactionId);
            }
        });

        const resyncWindowed = Effect.fnUntraced(function* (accountId: number, sinceDays: number) {
            const now = yield* DateTime.now;
            const since = DateTime.toDateUtc(DateTime.subtractDuration(now, sinceDays * millisecondsPerDay));
            yield* unconsolidateCanonicals(
                transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIdsSince([accountId], since)
            );
            yield* syncRepository.resetForWindowedResync(accountId, since);
        });

        return {
            resync: Effect.fn('ResyncService.resync')(function* (input: ResyncInputInterface) {
                const { accountId, sinceDays } = input;
                const sync = yield* syncRepository.getByAccountId(accountId);

                if (sync?.provider === ExternalSourceEnum.INZHUR) {
                    return;
                }

                if (isDefined(sinceDays)) {
                    yield* Db.transaction(resyncWindowed(accountId, sinceDays));
                } else {
                    const setupBalance =
                        sync?.provider === ExternalSourceEnum.MONOBANK ? yield* monobankSyncService.fetchSetupBalance(accountId) : null;
                    yield* Db.transaction(resyncFull(accountId, setupBalance));
                }

                const service = yield* syncProviderRegistryService.getServiceForAccount(accountId);

                if (isDefined(service) && 'requestSync' in service) {
                    yield* syncRepository.recoverByAccountId(accountId);
                    yield* service.requestSync();
                }
            })
        };
    })
}) {
    static readonly layer = Layer.effect(ResyncService, ResyncService.make).pipe(
        Layer.provide([
            SyncRepository.layer,
            TransactionConsolidationRepository.layer,
            UnconsolidationService.layer,
            AccountBalanceIncrementalService.layer,
            TransactionService.layer,
            MonobankSyncService.layer,
            SyncProviderRegistryService.layer
        ])
    );
}

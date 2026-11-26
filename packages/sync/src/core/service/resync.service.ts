import { UnconsolidationService } from '@budgie/consolidation';
import { Db, ExternalSourceEnum, SyncRepository, TransactionConsolidationRepository, TransactionRepository } from '@budgie/contracts';
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
        const transactionRepository = yield* TransactionRepository;
        const unconsolidationService = yield* UnconsolidationService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transactionService = yield* TransactionService;
        const monobankSyncService = yield* MonobankSyncService;
        const syncProviderRegistryService = yield* SyncProviderRegistryService;
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const yieldEveryRows = 5;

        const unconsolidateCanonicals = Effect.fnUntraced(function* <E>(
            fetchCanonicals: Effect.Effect<Array<Pick<TransactionEntityInterface, 'id'>>, E, Db>
        ) {
            const seenIds = new Set<number>();
            const affectedAccountIds = new Set<number>();
            let canonicals = yield* fetchCanonicals;

            while (isNotEmptyArray(canonicals)) {
                const loadedCanonicals = yield* transactionRepository.findByIdsWithRefundConsolidationHistory(
                    canonicals.map(canonical => canonical.id)
                );

                for (const canonical of loadedCanonicals) {
                    if (isDefined(canonical.fromAccountId)) {
                        affectedAccountIds.add(canonical.fromAccountId);
                    }
                    if (isDefined(canonical.toAccountId)) {
                        affectedAccountIds.add(canonical.toAccountId);
                    }
                    for (const entry of canonical.entries) {
                        affectedAccountIds.add(entry.accountId);
                    }
                }

                for (const [index, canonical] of canonicals.entries()) {
                    seenIds.add(canonical.id);
                    yield* Db.transaction(unconsolidationService.unconsolidateById(canonical.id));

                    if ((index + 1) % yieldEveryRows === 0 && index + 1 < canonicals.length) {
                        yield* Effect.yieldNow;
                    }
                }

                canonicals = (yield* fetchCanonicals).filter(canonical => !seenIds.has(canonical.id));
            }

            if (affectedAccountIds.size > 0) {
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([...affectedAccountIds]);
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
            TransactionRepository.layer,
            UnconsolidationService.layer,
            AccountBalanceIncrementalService.layer,
            TransactionService.layer,
            MonobankSyncService.layer,
            SyncProviderRegistryService.layer
        ])
    );
}

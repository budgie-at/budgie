import { SyncModeEnum, SyncRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { SyncBalanceSnapshotInterface } from '../interface/sync-balance-snapshot.interface';
import type { ExternalSourceEnum } from '@budgie/contracts';

export class SyncBalanceReconciliationService extends Context.Service<SyncBalanceReconciliationService>()(
    '@budgie/sync/SyncBalanceReconciliationService',
    {
        make: Effect.gen(function* () {
            const syncRepository = yield* SyncRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

            const anchor = Effect.fnUntraced(function* (syncId: number, accountId: number, snapshot: SyncBalanceSnapshotInterface) {
                yield* syncRepository.update(syncId, { reconciledAt: snapshot.at, reconciledBalance: snapshot.balance });
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
            });

            return {
                reconcile: Effect.fn('SyncBalanceReconciliationService.reconcile')(function* (
                    accountId: number,
                    snapshot: SyncBalanceSnapshotInterface
                ) {
                    const sync = yield* syncRepository.getByAccountId(accountId);
                    if (
                        sync?.mode !== SyncModeEnum.FORWARD ||
                        isDefined(sync.setupBalance) ||
                        !isDefined(sync.forwardSyncFromAt) ||
                        sync.forwardSyncFromAt < snapshot.at
                    ) {
                        return;
                    }

                    yield* anchor(sync.id, accountId, snapshot);
                }),
                reconcileStatement: Effect.fn('SyncBalanceReconciliationService.reconcileStatement')(function* (
                    accountId: number,
                    provider: ExternalSourceEnum,
                    snapshot: SyncBalanceSnapshotInterface
                ) {
                    const sync = yield* syncRepository.getByAccountId(accountId);
                    if (
                        sync?.provider !== provider ||
                        sync.mode !== SyncModeEnum.FORWARD ||
                        isDefined(sync.setupBalance) ||
                        (isDefined(sync.reconciledAt) && sync.reconciledAt > snapshot.at)
                    ) {
                        return;
                    }

                    yield* anchor(sync.id, accountId, snapshot);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(SyncBalanceReconciliationService, SyncBalanceReconciliationService.make).pipe(
        Layer.provide([SyncRepository.layer, AccountBalanceIncrementalService.layer])
    );
}

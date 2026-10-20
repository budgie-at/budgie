import { AccountBalanceRepository, SyncModeEnum, SyncRepository, convertToMicroUnits } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { SyncBalanceReviewInterface } from '../interface/sync-balance-review.interface';
import type { SyncBalanceSnapshotInterface } from '../interface/sync-balance-snapshot.interface';
import type { SyncBalanceTimelineRowInterface } from '../interface/sync-balance-timeline-row.interface';
import type { SyncEntityInterface } from '@budgie/contracts';

export class SyncBalanceReconciliationService extends Context.Service<SyncBalanceReconciliationService>()(
    '@budgie/sync/SyncBalanceReconciliationService',
    {
        make: Effect.gen(function* () {
            const syncRepository = yield* SyncRepository;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const autoApplyBalanceShare = 0.01;
            const autoApplyMinimum = convertToMicroUnits(1);

            const isAutoApplicable = (drift: number, balance: number): boolean =>
                Math.abs(drift) <= Math.max(Math.abs(balance) * autoApplyBalanceShare, autoApplyMinimum);

            const applyAnchor = Effect.fnUntraced(function* (sync: SyncEntityInterface, snapshot: SyncBalanceSnapshotInterface) {
                yield* syncRepository.update(sync.id, {
                    reconciledAt: snapshot.at,
                    reconciledBalance: snapshot.balance,
                    pendingReconciliationAt: null,
                    pendingReconciliationBalance: null
                });
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([sync.accountId]);
            });

            const findDriftStartAt = (timeline: readonly SyncBalanceTimelineRowInterface[]): Date | null => {
                const ledgerBalanceAt = new Map<number, number>();
                timeline.reduce((runningBalance, row) => {
                    const nextBalance = runningBalance + row.amount;
                    ledgerBalanceAt.set(row.operatedAt.getTime(), nextBalance);

                    return nextBalance;
                }, 0);
                const offsets = timeline.flatMap(({ operatedAt, providerBalance }) =>
                    isDefined(providerBalance)
                        ? [{ operatedAt, offset: providerBalance - (ledgerBalanceAt.get(operatedAt.getTime()) ?? 0) }]
                        : []
                );
                const latestOffset = offsets.at(-1)?.offset;
                const lastDifferentIndex = offsets.findLastIndex(({ offset }) => offset !== latestOffset);

                return offsets.at(lastDifferentIndex + 1)?.operatedAt ?? null;
            };

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

                    const drift = snapshot.balance - (yield* accountBalanceRepository.getLedgerBalanceUntil(accountId, snapshot.at));
                    if (isAutoApplicable(drift, snapshot.balance)) {
                        yield* applyAnchor(sync, snapshot);

                        return;
                    }

                    yield* syncRepository.update(sync.id, {
                        pendingReconciliationAt: snapshot.at,
                        pendingReconciliationBalance: snapshot.balance
                    });
                }),
                approve: Effect.fn('SyncBalanceReconciliationService.approve')(function* (accountId: number) {
                    const sync = yield* syncRepository.getByAccountId(accountId);
                    if (!isDefined(sync?.pendingReconciliationAt) || !isDefined(sync.pendingReconciliationBalance)) {
                        return;
                    }

                    yield* applyAnchor(sync, { at: sync.pendingReconciliationAt, balance: sync.pendingReconciliationBalance });
                }),
                getPendingReview: Effect.fn('SyncBalanceReconciliationService.getPendingReview')(function* (accountId: number) {
                    const sync = yield* syncRepository.getByAccountId(accountId);
                    if (!isDefined(sync?.pendingReconciliationAt) || !isDefined(sync.pendingReconciliationBalance)) {
                        return null;
                    }

                    const ledgerBalance = yield* accountBalanceRepository.getLedgerBalanceUntil(accountId, sync.pendingReconciliationAt);

                    return {
                        delta: sync.pendingReconciliationBalance - ledgerBalance,
                        driftStartAt: findDriftStartAt(yield* accountBalanceRepository.getBalanceTimeline(accountId))
                    } satisfies SyncBalanceReviewInterface;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(SyncBalanceReconciliationService, SyncBalanceReconciliationService.make).pipe(
        Layer.provide([SyncRepository.layer, AccountBalanceRepository.layer, AccountBalanceIncrementalService.layer])
    );
}

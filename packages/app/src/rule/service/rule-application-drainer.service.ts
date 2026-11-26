import { YIELD_TO_UI } from '@budgie/contracts';
import { RuleEngineService } from '@budgie/rules';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Latch from 'effect/Latch';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';

import type { PendingRuleApplicationInterface } from '../interface/pending-rule-application.interface';
import type { PendingTransactionBatchInterface } from '../interface/pending-transaction-batch.interface';
import type { Db, TransactionCreateInputInterface } from '@budgie/contracts';
import type { ApplyRuleResultInterface } from '@budgie/rules';

export class RuleApplicationDrainerService extends Context.Service<RuleApplicationDrainerService>()(
    '@budgie/app/RuleApplicationDrainerService',
    {
        make: Effect.gen(function* () {
            const workload = yield* Workload;
            const ruleEngineService = yield* RuleEngineService;
            const drainKey = 'rule-application-drain';
            const drainDelayMs = 250;
            const pendingRuleApplications: PendingRuleApplicationInterface[] = [];
            const pendingTransactionBatches: PendingTransactionBatchInterface[] = [];
            const initialCancelLatch = yield* Latch.make(false);
            const cancelLatchRef = yield* Ref.make(initialCancelLatch);

            const hasPendingWork = (): boolean => isNotEmptyArray(pendingTransactionBatches) || isNotEmptyArray(pendingRuleApplications);

            const runUntilSettled = <A, E>(effect: Effect.Effect<A, E, Db>, cancelLatch: Latch.Latch): Effect.Effect<A, E> =>
                workload.run(effect).pipe(
                    Effect.catchCauseIf(Cause.hasInterruptsOnly, () =>
                        cancelLatch.isOpen()
                            ? Effect.interrupt
                            : Effect.andThen(
                                  Effect.raceFirst(workload.awaitBackgroundAllowed, cancelLatch.await),
                                  Effect.suspend(() => (cancelLatch.isOpen() ? Effect.interrupt : runUntilSettled(effect, cancelLatch)))
                              )
                    )
                );

            const takePendingTransactionBatch = (): PendingTransactionBatchInterface | null => {
                if (!isNotEmptyArray(pendingTransactionBatches)) {
                    return null;
                }

                const batches = pendingTransactionBatches.splice(0);

                if (batches.length === 1) {
                    return batches[0];
                }

                const transactionIds: number[] = [];
                const transactionInputs: TransactionCreateInputInterface[] = [];

                for (const batch of batches) {
                    for (let index = 0; index < batch.transactionIds.length; index += 1) {
                        transactionIds.push(batch.transactionIds[index]);
                        transactionInputs.push(batch.transactionInputs[index]);
                    }
                }

                return { transactionIds, transactionInputs };
            };

            const processPendingTransactionBatch = Effect.fn('RuleApplicationDrainerService.processPendingTransactionBatch')(function* (
                cancelLatch: Latch.Latch
            ) {
                const batch = takePendingTransactionBatch();

                if (!isDefined(batch)) {
                    return;
                }

                const { transactionIds, transactionInputs } = batch;

                yield* runUntilSettled(ruleEngineService.applyRulesToTransactions(transactionIds, transactionInputs), cancelLatch).pipe(
                    Effect.tapCause(cause =>
                        Effect.logError('processPendingTransactionBatch:throw', {
                            queuedTransactionCount: transactionIds.length,
                            queuedInputCount: transactionInputs.length,
                            errorMessage: cause.pipe(Cause.squash, getErrorMessage)
                        })
                    ),
                    Effect.ignoreCause
                );
                yield* YIELD_TO_UI;
            });

            const processPendingRuleBatch = Effect.fn('RuleApplicationDrainerService.processPendingRuleBatch')(function* (
                cancelLatch: Latch.Latch
            ) {
                const pending = pendingRuleApplications.shift();

                if (!isDefined(pending)) {
                    return;
                }

                const { ruleId, onSettled } = pending;

                yield* runUntilSettled(ruleEngineService.applyRuleToMatchingTransactions(ruleId), cancelLatch).pipe(
                    Effect.matchCause({
                        onSuccess: result => {
                            onSettled?.(result, null);
                        },
                        onFailure: cause => {
                            onSettled?.(null, Cause.squash(cause));
                        }
                    })
                );
                yield* YIELD_TO_UI;
            });

            const drainLoop = Effect.fnUntraced(function* (cancelLatch: Latch.Latch) {
                yield* Effect.sleep(drainDelayMs);
                yield* waitForIdle;

                while (hasPendingWork()) {
                    yield* processPendingTransactionBatch(cancelLatch);
                    yield* processPendingRuleBatch(cancelLatch);
                }
            });

            const drain = Effect.fn('RuleApplicationDrainerService.drain')(function* () {
                const cancelLatch = yield* Ref.get(cancelLatchRef);

                yield* Effect.raceFirst(drainLoop(cancelLatch), cancelLatch.await);
            });

            const scheduleDrain = Effect.fn('RuleApplicationDrainerService.scheduleDrain')(function* () {
                yield* workload.schedule(drainKey, drain());
            });

            return {
                enqueueTransactions: Effect.fn('RuleApplicationDrainerService.enqueueTransactions')(function* (
                    transactionIds: number[],
                    transactionInputs: TransactionCreateInputInterface[]
                ) {
                    const count = Math.min(transactionIds.length, transactionInputs.length);

                    if (count === 0) {
                        return;
                    }

                    pendingTransactionBatches.push({
                        transactionIds: count === transactionIds.length ? [...transactionIds] : transactionIds.slice(0, count),
                        transactionInputs: count === transactionInputs.length ? [...transactionInputs] : transactionInputs.slice(0, count)
                    });
                    yield* scheduleDrain();
                }),
                enqueueRuleApplication: Effect.fn('RuleApplicationDrainerService.enqueueRuleApplication')(function* (
                    ruleId: number,
                    onSettled?: (result: ApplyRuleResultInterface | null, error: unknown) => void
                ) {
                    if (pendingRuleApplications.some(pending => pending.ruleId === ruleId)) {
                        return;
                    }

                    pendingRuleApplications.push({ ruleId, onSettled });
                    yield* scheduleDrain();
                }),
                cancelPending: Effect.fn('RuleApplicationDrainerService.cancelPending')(function* () {
                    const nextLatch = yield* Latch.make(false);
                    const previousLatch = yield* Ref.getAndSet(cancelLatchRef, nextLatch);

                    pendingRuleApplications.splice(0);
                    pendingTransactionBatches.splice(0);
                    yield* previousLatch.open;
                    yield* workload.cancelScheduled(drainKey);

                    if (hasPendingWork()) {
                        yield* scheduleDrain();
                    }
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(RuleApplicationDrainerService, RuleApplicationDrainerService.make).pipe(
        Layer.provide([Workload.layer, RuleEngineService.layer])
    );
}

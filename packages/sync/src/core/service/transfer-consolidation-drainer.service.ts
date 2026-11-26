import { mergeConsolidationScopes } from '@budgie/consolidation';
import { TransferConsolidationService } from '@budgie/ledger';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { isDefined } from '@rnw-community/shared';

import { TransferConsolidationWorkload } from '../port/transfer-consolidation-workload.port';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class TransferConsolidationDrainerService extends Context.Service<TransferConsolidationDrainerService>()(
    '@budgie/sync/TransferConsolidationDrainerService',
    {
        make: Effect.gen(function* () {
            const workload = yield* TransferConsolidationWorkload;
            const transferConsolidationService = yield* TransferConsolidationService;
            const scheduleKey = 'transfer-consolidation-drain';
            const drainDelay = Duration.seconds(1.5);
            const drainerState = yield* Ref.make<{
                readonly isScheduled: boolean;
                readonly scheduledRunId: number;
                readonly hasPending: boolean;
                readonly scope: ConsolidationScanScopeInterface | null;
                readonly cancelledGeneration: number;
            }>({
                isScheduled: false,
                scheduledRunId: 0,
                hasPending: false,
                scope: null,
                cancelledGeneration: 0
            });

            const mergePendingScope = (
                hasPending: boolean,
                currentScope: ConsolidationScanScopeInterface | null,
                nextScope: ConsolidationScanScopeInterface | null
            ): ConsolidationScanScopeInterface | null => {
                if (!hasPending) {
                    return nextScope;
                }

                if (!isDefined(currentScope) || !isDefined(nextScope)) {
                    return null;
                }

                return mergeConsolidationScopes(currentScope, nextScope);
            };

            const enterIteration = Effect.map(Ref.get(drainerState), state => state.hasPending);

            const takePendingRun = Ref.modify(drainerState, state =>
                state.hasPending
                    ? ([
                          { scope: state.scope, generation: state.cancelledGeneration },
                          { ...state, hasPending: false, scope: null }
                      ] as const)
                    : ([null, state] as const)
            );

            const resolvePostExitSchedule = (expectedRunId: number) =>
                Ref.modify(drainerState, state => {
                    if (state.scheduledRunId !== expectedRunId) {
                        return [null, state] as const;
                    }

                    if (state.hasPending) {
                        const nextRunId = state.scheduledRunId + 1;

                        return [nextRunId, { ...state, isScheduled: true, scheduledRunId: nextRunId }] as const;
                    }

                    return [null, { ...state, isScheduled: false }] as const;
                });

            const schedulePostExit = (
                expectedRunId: number,
                scheduleRun: (nextRunId: number) => Effect.Effect<void>
            ): Effect.Effect<void> =>
                Effect.flatMap(resolvePostExitSchedule(expectedRunId), nextRunId =>
                    isDefined(nextRunId) ? workload.schedule(scheduleKey, scheduleRun(nextRunId), { replace: true }) : Effect.void
                );

            const drain: (runId: number) => Effect.Effect<void> = Effect.fn('TransferConsolidationDrainerService.drain')(function* (
                runId: number
            ) {
                yield* Effect.ensuring(
                    Effect.gen(function* () {
                        while (yield* enterIteration) {
                            yield* Effect.sleep(drainDelay);
                            yield* workload.awaitForegroundIdle;
                            yield* workload.awaitIdle;

                            const pendingRun = yield* takePendingRun;
                            if (!isDefined(pendingRun)) {
                                return;
                            }

                            yield* Effect.yieldNow;
                            const exit = yield* Effect.exit(workload.run(transferConsolidationService.consolidate(pendingRun.scope)));

                            if (Exit.isFailure(exit)) {
                                if (Cause.hasInterruptsOnly(exit.cause)) {
                                    yield* Ref.modify(
                                        drainerState,
                                        state =>
                                            [
                                                null,
                                                state.cancelledGeneration === pendingRun.generation
                                                    ? {
                                                          ...state,
                                                          hasPending: true,
                                                          scope: mergePendingScope(state.hasPending, state.scope, pendingRun.scope)
                                                      }
                                                    : state
                                            ] as const
                                    );
                                } else {
                                    yield* Effect.logError(exit.cause);
                                }
                            }

                            yield* Effect.yieldNow;
                        }
                    }),
                    schedulePostExit(runId, drain)
                );
            });

            return {
                enqueue: Effect.fn('TransferConsolidationDrainerService.enqueue')(function* (
                    scope: ConsolidationScanScopeInterface | null = null
                ) {
                    const nextRunId = yield* Ref.modify(drainerState, state => {
                        const mergedScope = mergePendingScope(state.hasPending, state.scope, scope);

                        if (state.isScheduled) {
                            return [null, { ...state, hasPending: true, scope: mergedScope }] as const;
                        }

                        const runId = state.scheduledRunId + 1;

                        return [
                            runId,
                            { ...state, isScheduled: true, scheduledRunId: runId, hasPending: true, scope: mergedScope }
                        ] as const;
                    });

                    if (isDefined(nextRunId)) {
                        yield* workload.schedule(scheduleKey, drain(nextRunId), { replace: true });
                    }
                }),
                cancelPending: Effect.fn('TransferConsolidationDrainerService.cancelPending')(function* () {
                    const cancelledRunId = yield* Ref.modify(
                        drainerState,
                        state =>
                            [
                                state.scheduledRunId,
                                {
                                    ...state,
                                    hasPending: false,
                                    scope: null,
                                    cancelledGeneration: state.cancelledGeneration + 1
                                }
                            ] as const
                    );

                    yield* workload.cancelScheduled(scheduleKey);
                    yield* schedulePostExit(cancelledRunId, drain);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransferConsolidationDrainerService, TransferConsolidationDrainerService.make).pipe(
        Layer.provide(TransferConsolidationService.layer)
    );
}

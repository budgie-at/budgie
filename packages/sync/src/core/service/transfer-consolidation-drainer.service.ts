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
                readonly isRunning: boolean;
                readonly hasPending: boolean;
                readonly scope: ConsolidationScanScopeInterface | null;
                readonly cancelledGeneration: number;
            }>({
                isRunning: false,
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

            const enterIteration = Ref.modify(drainerState, state =>
                state.hasPending ? ([true, { ...state, isRunning: true }] as const) : ([false, { ...state, isRunning: false }] as const)
            );

            const takePendingRun = Ref.modify(drainerState, state =>
                state.hasPending
                    ? ([
                          { scope: state.scope, generation: state.cancelledGeneration },
                          { ...state, isRunning: true, hasPending: false, scope: null }
                      ] as const)
                    : ([null, { ...state, isRunning: false }] as const)
            );

            const drain: () => Effect.Effect<void> = Effect.fn('TransferConsolidationDrainerService.drain')(
                function* () {
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
                },
                effect =>
                    Effect.ensuring(
                        effect,
                        Effect.flatMap(
                            Ref.modify(drainerState, state => [state.hasPending, { ...state, isRunning: false }] as const),
                            hasPending => (hasPending ? workload.schedule(scheduleKey, drain()) : Effect.void)
                        )
                    )
            );

            return {
                enqueue: Effect.fn('TransferConsolidationDrainerService.enqueue')(function* (
                    scope: ConsolidationScanScopeInterface | null = null
                ) {
                    const shouldSchedule = yield* Ref.modify(
                        drainerState,
                        state =>
                            [
                                !state.isRunning,
                                {
                                    ...state,
                                    hasPending: true,
                                    scope: mergePendingScope(state.hasPending, state.scope, scope)
                                }
                            ] as const
                    );

                    if (shouldSchedule) {
                        yield* workload.schedule(scheduleKey, drain());
                    }
                }),
                cancelPending: Effect.fn('TransferConsolidationDrainerService.cancelPending')(function* () {
                    yield* Ref.modify(
                        drainerState,
                        state =>
                            [
                                null,
                                {
                                    ...state,
                                    hasPending: false,
                                    scope: null,
                                    cancelledGeneration: state.cancelledGeneration + 1
                                }
                            ] as const
                    );
                    yield* workload.cancelScheduled(scheduleKey);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransferConsolidationDrainerService, TransferConsolidationDrainerService.make).pipe(
        Layer.provide(TransferConsolidationService.layer)
    );
}

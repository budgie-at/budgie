import { mergeConsolidationScopes } from '@budgie/consolidation';
import { TransferConsolidationService } from '@budgie/ledger';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as FiberHandle from 'effect/FiberHandle';
import * as Latch from 'effect/Latch';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
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
            const drainDelay = Duration.seconds(1.5);
            const pendingScope = yield* Ref.make<Option.Option<ConsolidationScanScopeInterface | null>>(Option.none());
            const hasWork = yield* Latch.make(false);
            const activeRun = yield* FiberHandle.make();

            const mergePendingScope = (
                current: Option.Option<ConsolidationScanScopeInterface | null>,
                nextScope: ConsolidationScanScopeInterface | null
            ): ConsolidationScanScopeInterface | null => {
                if (Option.isNone(current)) {
                    return nextScope;
                }

                if (!isDefined(current.value) || !isDefined(nextScope)) {
                    return null;
                }

                return mergeConsolidationScopes(current.value, nextScope);
            };

            const enqueueScope = (scope: ConsolidationScanScopeInterface | null) =>
                Effect.uninterruptible(
                    Ref.update(pendingScope, current => Option.some(mergePendingScope(current, scope))).pipe(Effect.andThen(hasWork.open))
                );

            const drain = Effect.fn('TransferConsolidationDrainerService.drain')(function* () {
                yield* Effect.sleep(drainDelay);
                yield* workload.awaitForegroundIdle;
                yield* workload.awaitIdle;

                const scopeOption = yield* Ref.getAndSet(pendingScope, Option.none());
                if (Option.isNone(scopeOption)) {
                    return;
                }

                yield* Effect.yieldNow;
                const exit = yield* Effect.exit(workload.run(transferConsolidationService.consolidate(scopeOption.value)));

                if (Exit.isFailure(exit)) {
                    if (Cause.hasInterruptsOnly(exit.cause)) {
                        yield* enqueueScope(scopeOption.value);
                    } else {
                        yield* Effect.logError(exit.cause);
                    }
                }

                yield* Effect.yieldNow;
            });

            yield* Effect.gen(function* () {
                yield* hasWork.await;
                yield* hasWork.close;

                const initialPending = yield* Ref.get(pendingScope);
                if (Option.isNone(initialPending)) {
                    return;
                }

                const cycleFiber = yield* FiberHandle.run(activeRun, drain());
                yield* Fiber.await(cycleFiber);

                const remainingPending = yield* Ref.get(pendingScope);
                if (Option.isSome(remainingPending)) {
                    yield* hasWork.open;
                }
            }).pipe(Effect.forever, Effect.forkScoped);

            return {
                enqueue: Effect.fn('TransferConsolidationDrainerService.enqueue')(function* (
                    scope: ConsolidationScanScopeInterface | null = null
                ) {
                    yield* enqueueScope(scope);
                }),
                cancelPending: Effect.fn('TransferConsolidationDrainerService.cancelPending')(function* () {
                    yield* Ref.set(pendingScope, Option.none());
                    yield* FiberHandle.clear(activeRun);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransferConsolidationDrainerService, TransferConsolidationDrainerService.make).pipe(
        Layer.provide(TransferConsolidationService.layer)
    );
}

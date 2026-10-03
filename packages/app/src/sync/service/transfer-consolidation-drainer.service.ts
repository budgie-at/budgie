import { consolidationScopeService } from '@budgie/consolidation';
import { TransferConsolidationService } from '@budgie/sync';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { isDefined } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class TransferConsolidationDrainerService extends Context.Service<TransferConsolidationDrainerService>()(
    '@budgie/app/TransferConsolidationDrainerService',
    {
        make: Effect.gen(function* () {
            const workload = yield* Workload;
            const transferConsolidationService = yield* TransferConsolidationService;
            const scheduleKey = 'transfer-consolidation-drain';
            const drainDelay = Duration.seconds(1.5);
            const hasPendingRun = yield* Ref.make(false);
            const pendingScope = yield* Ref.make<ConsolidationScanScopeInterface | null>(null);
            const takePendingScope = Effect.andThen(Ref.set(hasPendingRun, false), Ref.getAndSet(pendingScope, null));

            const addPendingScope = Effect.fnUntraced(function* (scope: ConsolidationScanScopeInterface | null) {
                if (!(yield* Ref.get(hasPendingRun))) {
                    yield* Ref.set(pendingScope, scope);

                    return;
                }

                if (!isDefined(scope)) {
                    yield* Ref.set(pendingScope, null);

                    return;
                }

                yield* Ref.update(pendingScope, currentScope =>
                    isDefined(currentScope) ? consolidationScopeService.merge(currentScope, scope) : currentScope
                );
            });

            const drain = Effect.fn('TransferConsolidationDrainerService.drain')(function* () {
                while (yield* Ref.get(hasPendingRun)) {
                    yield* Effect.sleep(drainDelay);
                    yield* workload.awaitForegroundIdle;
                    yield* waitForIdle;
                    const scope = yield* takePendingScope;
                    yield* Effect.yieldNow;
                    yield* Effect.exit(workload.run(transferConsolidationService.consolidate(scope)));
                    yield* Effect.yieldNow;
                }
            });

            return {
                enqueue: Effect.fn('TransferConsolidationDrainerService.enqueue')(function* (
                    scope: ConsolidationScanScopeInterface | null = null
                ) {
                    yield* addPendingScope(scope);
                    yield* Ref.set(hasPendingRun, true);
                    yield* workload.schedule(scheduleKey, drain());
                }),
                cancelPending: Effect.fn('TransferConsolidationDrainerService.cancelPending')(function* () {
                    yield* takePendingScope;
                    yield* workload.cancelScheduled(scheduleKey);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransferConsolidationDrainerService, TransferConsolidationDrainerService.make).pipe(
        Layer.provide([Workload.layer, TransferConsolidationService.layer])
    );
}

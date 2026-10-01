import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { HistoricalMarketDataLoaderService } from '../../../market-data/service/historical-market-data-loader.service';
import { RuleApplicationDrainerService } from '../../../rule/service/rule-application-drainer.service';
import { TransferConsolidationDrainerService } from '../../../sync/service/transfer-consolidation-drainer.service';
import { Workload } from '../../service/workload.service';

import { DatabaseConnectionService } from './database-connection.service';

import type { DatabaseLifecycleOperationEnum } from '../enum/database-lifecycle-operation.enum';
import type { Db } from '@budgie/contracts';

export class DatabaseLifecycleService extends Context.Service<DatabaseLifecycleService>()('@budgie/app/DatabaseLifecycleService', {
    make: Effect.gen(function* () {
        const workload = yield* Workload;
        const databaseConnectionService = yield* DatabaseConnectionService;
        const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
        const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
        const historicalMarketDataLoaderService = yield* HistoricalMarketDataLoaderService;
        const drainTimeoutMs = 5000;
        const semaphore = yield* Semaphore.make(1);
        const closeLock = yield* Semaphore.make(1);
        const isClosed = yield* Ref.make(false);
        const inFlightOperations = new Map<DatabaseLifecycleOperationEnum, Fiber.Fiber<void, unknown>>();

        const closeHandle = Effect.fnUntraced(function* () {
            if (yield* Ref.get(isClosed)) {
                return;
            }

            yield* databaseConnectionService.close;
            yield* Ref.set(isClosed, true);
        });

        const runExclusively = Effect.fn('DatabaseLifecycleService.runExclusively')(function* (work: Effect.Effect<void, unknown, Db>) {
            yield* workload.block;
            yield* transferConsolidationDrainerService.cancelPending();
            yield* ruleApplicationDrainerService.cancelPending();
            yield* historicalMarketDataLoaderService.cancelScheduledDrain();
            yield* workload.awaitForegroundIdle.pipe(Effect.timeoutOption(drainTimeoutMs));
            yield* workload
                .runForeground(work)
                .pipe(Effect.onError(() => Effect.flatMap(Ref.get(isClosed), closed => (closed ? Effect.void : workload.unblock))));
        });

        return {
            run: Effect.fn('DatabaseLifecycleService.run')(function* (
                operation: DatabaseLifecycleOperationEnum,
                work: Effect.Effect<void, unknown, Db>
            ) {
                const inFlightOperation = inFlightOperations.get(operation);

                if (isDefined(inFlightOperation)) {
                    return yield* Fiber.join(inFlightOperation);
                }

                const queuedOperation = yield* semaphore
                    .withPermit(runExclusively(work))
                    .pipe(Effect.ensuring(Effect.sync(() => inFlightOperations.delete(operation))), Effect.forkDetach);

                inFlightOperations.set(operation, queuedOperation);

                return yield* Fiber.join(queuedOperation);
            }),
            close: Effect.fn('DatabaseLifecycleService.close')(function* () {
                yield* closeLock.withPermit(closeHandle());
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseLifecycleService, DatabaseLifecycleService.make).pipe(
        Layer.provide([
            Workload.layer,
            DatabaseConnectionService.layer,
            TransferConsolidationDrainerService.layer,
            RuleApplicationDrainerService.layer,
            HistoricalMarketDataLoaderService.layer
        ])
    );
}

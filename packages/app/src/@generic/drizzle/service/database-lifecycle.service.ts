import { CloudSyncService } from '@budgie/cloud-sync';
import { logAndContinue } from '@budgie/contracts';
import { TransferConsolidationDrainerService } from '@budgie/sync';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { HistoricalMarketDataDrainerService } from '../../../market-data/service/historical-market-data-drainer.service';
import { RuleApplicationDrainerService } from '../../../rule/service/rule-application-drainer.service';
import { transferConsolidationDrainerLayer } from '../../../sync/layer/transfer-consolidation-drainer.layer';
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
        const historicalMarketDataDrainerService = yield* HistoricalMarketDataDrainerService;
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

        const runExclusively = Effect.fn('DatabaseLifecycleService.runExclusively')(function* <E>(work: Effect.Effect<void, E, Db>) {
            const cloudSyncService = yield* Effect.serviceOption(CloudSyncService);
            const resumeCloudSync =
                Option.isSome(cloudSyncService) && (yield* cloudSyncService.value.stop())
                    ? logAndContinue(cloudSyncService.value.start())
                    : Effect.void;

            yield* workload.block;
            yield* transferConsolidationDrainerService.cancelPending();
            yield* ruleApplicationDrainerService.cancelPending();
            yield* historicalMarketDataDrainerService.cancelScheduledDrain;
            yield* workload.awaitForegroundIdle.pipe(Effect.timeoutOption(drainTimeoutMs));
            yield* workload
                .runForeground(work)
                .pipe(
                    Effect.onError(() =>
                        Effect.flatMap(Ref.get(isClosed), closed =>
                            closed ? Effect.void : workload.unblock.pipe(Effect.andThen(resumeCloudSync))
                        )
                    )
                );
        });

        return {
            run: Effect.fn('DatabaseLifecycleService.run')(function* <E>(
                operation: DatabaseLifecycleOperationEnum,
                work: Effect.Effect<void, E, Db>
            ) {
                const inFlightOperation = inFlightOperations.get(operation);

                if (isDefined(inFlightOperation)) {
                    return yield* Fiber.join(inFlightOperation).pipe(Effect.orDie);
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
            transferConsolidationDrainerLayer,
            RuleApplicationDrainerService.layer,
            HistoricalMarketDataDrainerService.layer
        ])
    );
}

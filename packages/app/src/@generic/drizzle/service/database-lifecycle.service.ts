import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { historicalMarketDataLoaderService } from '../../../market-data/service/historical-market-data-loader.service';
import { ruleApplicationDrainerService } from '../../../rule/service/rule-application-drainer.service';
import { transferConsolidationDrainerService } from '../../../sync/service/transfer-consolidation-drainer.service';
import { Workload } from '../../service/workload.service';
import { expoDb } from '../db/db';

import type { DatabaseLifecycleOperationEnum } from '../enum/database-lifecycle-operation.enum';
import type { Db } from '@budgie/contracts';

class DatabaseLifecycleService {
    private static readonly DRAIN_TIMEOUT_MS = 5000;

    readonly run = Effect.fn('DatabaseLifecycleService.run')(function* (
        this: DatabaseLifecycleService,
        operation: DatabaseLifecycleOperationEnum,
        work: Effect.Effect<void, unknown, Db>
    ) {
        const inFlightOperation = this.inFlightOperations.get(operation);

        if (isDefined(inFlightOperation)) {
            return yield* Fiber.join(inFlightOperation);
        }

        const queuedOperation = yield* this.semaphore
            .withPermit(this.runExclusively(work))
            .pipe(Effect.ensuring(Effect.sync(() => this.inFlightOperations.delete(operation))), Effect.forkDetach);

        this.inFlightOperations.set(operation, queuedOperation);

        return yield* Fiber.join(queuedOperation);
    });

    readonly close = Effect.fn('DatabaseLifecycleService.close')(function* (this: DatabaseLifecycleService) {
        yield* this.closeLock.withPermit(this.closeHandle());
    });

    private readonly closeHandle = Effect.fnUntraced(function* (this: DatabaseLifecycleService) {
        if (this.isClosed) {
            return;
        }

        yield* Effect.promise(() => expoDb.closeAsync());
        this.isClosed = true;
        this.clearDatabaseGlobals();
    });

    private readonly runExclusively = Effect.fn('DatabaseLifecycleService.runExclusively')(function* (
        this: DatabaseLifecycleService,
        work: Effect.Effect<void, unknown, Db>
    ) {
        const workload = yield* Workload;

        yield* workload.block;
        yield* transferConsolidationDrainerService.cancelPending();
        yield* ruleApplicationDrainerService.cancelPending();
        yield* historicalMarketDataLoaderService.cancelScheduledDrain();
        yield* workload.awaitForegroundIdle.pipe(Effect.timeoutOption(DatabaseLifecycleService.DRAIN_TIMEOUT_MS));
        yield* workload.runForeground(work).pipe(Effect.onError(() => (this.isClosed ? Effect.void : workload.unblock)));
    });

    private readonly semaphore = Semaphore.makeUnsafe(1);
    private readonly closeLock = Semaphore.makeUnsafe(1);
    private readonly inFlightOperations = new Map<DatabaseLifecycleOperationEnum, Fiber.Fiber<void, unknown>>();
    private isClosed = false;

    private clearDatabaseGlobals(): void {
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__expoSqliteDb__ = undefined;
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__drizzleDb__ = undefined;
    }
}

export const databaseLifecycleService = new DatabaseLifecycleService();

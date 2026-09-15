import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { historicalMarketDataLoaderService } from '../../../market-data/service/historical-market-data-loader.service';
import { ruleApplicationDrainerService } from '../../../rule/service/rule-application-drainer.service';
import { syncWorkloadService } from '../../../sync/service/sync-workload.service';
import { transferConsolidationDrainerService } from '../../../sync/service/transfer-consolidation-drainer.service';
import { foregroundWorkloadService } from '../../service/foreground-workload.service';
import { microPause } from '../../utils/micro-pause.util';
import { expoDb } from '../db/db';

import type { DatabaseLifecycleOperationEnum } from '../enum/database-lifecycle-operation.enum';

class DatabaseLifecycleService {
    private static readonly DRAIN_TIMEOUT_MS = 5000;

    private readonly inFlightOperations = new Map<DatabaseLifecycleOperationEnum, Promise<void>>();
    private isClosed = false;
    private pendingOperation: Promise<unknown> = Promise.resolve();

    @Log(
        (operation, work) => `enter operation=${operation} workName="${work.name}"`,
        (result, operation, work) => `done operation=${operation} workName="${work.name}" result=${String(result)}`,
        (error, operation, work) => `throw operation=${operation} workName="${work.name}" error=${getErrorMessage(error)}`
    )
    async run(operation: DatabaseLifecycleOperationEnum, work: () => Promise<void>): Promise<void> {
        const inFlightOperation = this.inFlightOperations.get(operation);

        if (isDefined(inFlightOperation)) {
            return inFlightOperation;
        }

        const queuedOperation = this.pendingOperation.then(
            () => this.runExclusively(work),
            () => this.runExclusively(work)
        );

        this.inFlightOperations.set(operation, queuedOperation);
        this.pendingOperation = queuedOperation.then(
            () => this.inFlightOperations.delete(operation),
            () => this.inFlightOperations.delete(operation)
        );

        return queuedOperation;
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async close(): Promise<void> {
        if (this.isClosed) {
            return;
        }

        this.isClosed = true;
        await expoDb.closeAsync();
        this.clearDatabaseGlobals();
    }

    private async runExclusively(work: () => Promise<void>): Promise<void> {
        this.cancelBackgroundWork();
        await this.waitForForegroundIdle();
        await foregroundWorkloadService.run(work);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private cancelBackgroundWork(): void {
        syncWorkloadService.cancelPendingAndBlockNewWork();
        transferConsolidationDrainerService.cancelPending();
        ruleApplicationDrainerService.cancelPending();
        historicalMarketDataLoaderService.cancelScheduledDrain();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async waitForForegroundIdle(): Promise<void> {
        if (!foregroundWorkloadService.isActive()) {
            return;
        }

        await Promise.race([foregroundWorkloadService.whenIdle(), microPause(DatabaseLifecycleService.DRAIN_TIMEOUT_MS)]);
    }

    private clearDatabaseGlobals(): void {
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__expoSqliteDb__ = undefined;
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__drizzleDb__ = undefined;
    }
}

export const databaseLifecycleService = new DatabaseLifecycleService();

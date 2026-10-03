import { BinanceSyncService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { runBackgroundTask } from '../utils/run-background-task.util';

const BACKGROUND_RUN_BUDGET_MS = 25 * 1000;

TaskManager.defineTask(BINANCE_SYNC_TASK, () =>
    runBackgroundTask(
        Effect.gen(function* () {
            const workload = yield* Workload;
            const binanceSyncService = yield* BinanceSyncService;

            const isSuccess = yield* workload.run(binanceSyncService.sync(Date.now() + BACKGROUND_RUN_BUDGET_MS));

            return isSuccess ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
        })
    )
);

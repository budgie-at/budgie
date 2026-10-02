import { MONOBANK_SYNC_TASK, MonobankSyncService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { runBackgroundTask } from '../utils/run-background-task.util';

TaskManager.defineTask(MONOBANK_SYNC_TASK, () =>
    runBackgroundTask(
        Effect.gen(function* () {
            const workload = yield* Workload;
            const monobankSyncService = yield* MonobankSyncService;

            const isSuccess = yield* workload.run(monobankSyncService.sync());

            return isSuccess ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
        })
    )
);

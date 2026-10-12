import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { runBackgroundTask } from '../../@generic/utils/run-background-task.util';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type { SyncTaskServiceInterface } from '../interface/sync-task-service.interface';
import type * as Context from 'effect/Context';

const BACKGROUND_SYNC_RUN_BUDGET_MS = 25 * 1000;

export const defineSyncTask = <Identifier extends AppServices>(
    taskKey: string,
    serviceTag: Context.Key<Identifier, SyncTaskServiceInterface>
): void => {
    TaskManager.defineTask(taskKey, () =>
        runBackgroundTask(
            Effect.gen(function* () {
                const workload = yield* Workload;
                const service = yield* serviceTag;

                const isSuccess = yield* workload.run(service.sync(Date.now() + BACKGROUND_SYNC_RUN_BUDGET_MS));

                return isSuccess ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
            })
        )
    );
};

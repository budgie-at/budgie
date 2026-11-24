import * as Clock from 'effect/Clock';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { runBackgroundTask } from '../../@generic/utils/run-background-task.util';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type { SyncTaskServiceInterface } from '../interface/sync-task-service.interface';
import type * as Context from 'effect/Context';

const BACKGROUND_SYNC_RUN_BUDGET_MS = 25 * 1000;

export const defineSyncTask = <Identifier extends AppServices>(
    taskKey: string,
    loadServiceTag: () => Promise<Context.Key<Identifier, SyncTaskServiceInterface>>
): void => {
    TaskManager.defineTask(taskKey, () =>
        runBackgroundTask(() =>
            Effect.gen(function* () {
                const [serviceTag, { logAndContinue }, { RecurringRefreshService }, { Workload }, { RecurringReminderService }] =
                    yield* Effect.all(
                        [
                            Effect.promise(loadServiceTag),
                            Effect.promise(() => import('@budgie/contracts')),
                            Effect.promise(() => import('@budgie/recurring')),
                            Effect.promise(() => import('../../@generic/service/workload.service')),
                            Effect.promise(() => import('../../recurring/service/recurring-reminder.service'))
                        ],
                        { concurrency: 'unbounded' }
                    );

                const workload = yield* Workload;
                const service = yield* serviceTag;
                const recurringRefreshService = yield* RecurringRefreshService;

                const isSuccess = yield* workload.run(service.sync((yield* Clock.currentTimeMillis) + BACKGROUND_SYNC_RUN_BUDGET_MS));

                const recurringReminderService = yield* RecurringReminderService;
                yield* logAndContinue(
                    workload.run(
                        DateTime.nowAsDate.pipe(
                            Effect.flatMap(now =>
                                recurringRefreshService.matchRecent(now).pipe(Effect.andThen(recurringReminderService.reschedule(now)))
                            )
                        )
                    )
                );

                return isSuccess ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
            })
        )
    );
};

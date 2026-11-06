import { RecurringRefreshService } from '@budgie/recurring';
import * as Clock from 'effect/Clock';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { runBackgroundTask } from '../../@generic/utils/run-background-task.util';
import { RecurringReminderService } from '../../recurring/service/recurring-reminder.service';

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

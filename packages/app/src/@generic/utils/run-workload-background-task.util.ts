import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';

import { runBackgroundTask } from './run-background-task.util';

import type { AppServices } from '../runtime/app.runtime';
import type { Workload } from '../service/workload.service';
import type * as Context from 'effect/Context';

export const runWorkloadBackgroundTask = <E>(
    runWork: (workload: Context.Service.Shape<typeof Workload>) => Effect.Effect<unknown, E, AppServices>
): Promise<BackgroundTask.BackgroundTaskResult> =>
    runBackgroundTask(() =>
        Effect.as(
            Effect.gen(function* () {
                const { Workload: WorkloadTag } = yield* Effect.promise(() => import('../service/workload.service'));
                const workload = yield* WorkloadTag;

                return yield* runWork(workload);
            }),
            BackgroundTask.BackgroundTaskResult.Success
        )
    );

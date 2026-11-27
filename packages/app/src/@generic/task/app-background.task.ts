import * as Effect from 'effect/Effect';
import * as TaskManager from 'expo-task-manager';

import { APP_BACKGROUND_TASK } from '../constant/app-background-task.constant';
import { runBackgroundTask } from '../utils/run-background-task.util';

TaskManager.defineTask(APP_BACKGROUND_TASK, () =>
    runBackgroundTask(() =>
        Effect.gen(function* () {
            const { BackgroundTaskCoordinatorService } = yield* Effect.promise(
                () => import('../service/background-task-coordinator.service')
            );

            return yield* (yield* BackgroundTaskCoordinatorService).run();
        })
    )
);

import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { runBackgroundTask } from '../../@generic/utils/run-background-task.util';
import { WIDGET_SNAPSHOT_TASK } from '../constant/widget-snapshot-task.constant';

TaskManager.defineTask(WIDGET_SNAPSHOT_TASK, () =>
    runBackgroundTask(() =>
        Effect.gen(function* () {
            const [{ logAndContinue }, { SiriCatalogService }, { WidgetSnapshotService }] = yield* Effect.all(
                [
                    Effect.promise(() => import('@budgie/contracts')),
                    Effect.promise(() => import('../../siri/service/siri-catalog.service')),
                    Effect.promise(() => import('../service/widget-snapshot.service'))
                ],
                { concurrency: 'unbounded' }
            );
            const siriCatalogService = yield* SiriCatalogService;
            const widgetSnapshotService = yield* WidgetSnapshotService;

            yield* widgetSnapshotService.publish();
            yield* logAndContinue(siriCatalogService.publish());

            return BackgroundTask.BackgroundTaskResult.Success;
        })
    )
);

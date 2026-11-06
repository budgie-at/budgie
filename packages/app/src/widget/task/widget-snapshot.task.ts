import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { runBackgroundTask } from '../../@generic/utils/run-background-task.util';
import { SiriCatalogService } from '../../siri/service/siri-catalog.service';
import { WIDGET_SNAPSHOT_TASK } from '../constant/widget-snapshot-task.constant';
import { WidgetSnapshotService } from '../service/widget-snapshot.service';

TaskManager.defineTask(WIDGET_SNAPSHOT_TASK, () =>
    runBackgroundTask(
        Effect.gen(function* () {
            const siriCatalogService = yield* SiriCatalogService;
            const widgetSnapshotService = yield* WidgetSnapshotService;

            yield* logAndContinue(siriCatalogService.publish());
            yield* widgetSnapshotService.publish();

            return BackgroundTask.BackgroundTaskResult.Success;
        })
    )
);

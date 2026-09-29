import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { runBackgroundTask } from '../../sync/utils/run-background-task.util';
import { WIDGET_SNAPSHOT_TASK } from '../constant/widget-snapshot-task.constant';
import { widgetSnapshotService } from '../service/widget-snapshot.service';

TaskManager.defineTask(WIDGET_SNAPSHOT_TASK, () =>
    runBackgroundTask(Effect.as(widgetSnapshotService.publish(), BackgroundTask.BackgroundTaskResult.Success))
);

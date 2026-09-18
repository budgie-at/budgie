import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { WIDGET_SNAPSHOT_TASK } from '../constant/widget-snapshot-task.constant';
import { widgetSnapshotService } from '../service/widget-snapshot.service';

TaskManager.defineTask(WIDGET_SNAPSHOT_TASK, async () => {
    try {
        await widgetSnapshotService.publish();
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});

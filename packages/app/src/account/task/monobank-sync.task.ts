import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { monobankSyncService } from '../service/monobank-sync.service';

TaskManager.defineTask(MONOBANK_SYNC_TASK, async () => {
    try {
        const hasToken = await monobankSyncService.hasToken();

        if (!hasToken) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        await monobankSyncService.sync();
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});

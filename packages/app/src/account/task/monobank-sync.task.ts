import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { monobankSyncService } from '../service/monobank-sync.service';

TaskManager.defineTask(MONOBANK_SYNC_TASK, async () => {
    try {
        const isEnabled = await monobankSyncService.isEnabled();

        if (!isEnabled || !monobankSyncService.hasToken()) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        await monobankSyncService.sync();

        return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

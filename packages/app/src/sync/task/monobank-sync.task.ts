import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { monobankSyncService } from '../service/monobank-sync.service';
import { syncWorkloadService } from '../service/sync-workload.service';

TaskManager.defineTask(MONOBANK_SYNC_TASK, async () => {
    try {
        return await syncWorkloadService.run('background-monobank', () => monobankSyncService.sync());
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

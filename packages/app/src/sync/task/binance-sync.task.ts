import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { binanceSyncService } from '../service/binance-sync.service';
import { syncWorkloadService } from '../service/sync-workload.service';

TaskManager.defineTask(BINANCE_SYNC_TASK, async () => {
    try {
        return await syncWorkloadService.run('background-binance', () => binanceSyncService.sync());
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

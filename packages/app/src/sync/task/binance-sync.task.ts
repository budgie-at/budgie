import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { binanceSyncService } from '../service/binance-sync.service';
import { syncWorkloadService } from '../service/sync-workload.service';

const BACKGROUND_RUN_BUDGET_MS = 25 * 1000;

TaskManager.defineTask(BINANCE_SYNC_TASK, async () => {
    try {
        const deadlineAtMs = Date.now() + BACKGROUND_RUN_BUDGET_MS;

        return await syncWorkloadService.run('background-binance', () => binanceSyncService.sync(deadlineAtMs));
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

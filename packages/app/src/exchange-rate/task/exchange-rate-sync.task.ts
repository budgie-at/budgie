import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { syncWorkloadService } from '../../sync/service/sync-workload.service';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { exchangeRatesSyncService } from '../service/exchange-rates-sync.service';

TaskManager.defineTask(EXCHANGE_RATE_SYNC_TASK, async () => {
    try {
        await syncWorkloadService.run('background-exchange-rates', () => exchangeRatesSyncService.sync());
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});

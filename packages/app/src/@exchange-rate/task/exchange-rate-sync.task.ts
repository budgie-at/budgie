import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { exchangeRatesService } from '../service/exchange-rates-sync.service';

TaskManager.defineTask(EXCHANGE_RATE_SYNC_TASK, async () => {
    try {
        await exchangeRatesService.sync();
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});

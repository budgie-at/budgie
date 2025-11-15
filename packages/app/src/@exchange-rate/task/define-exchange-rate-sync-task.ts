 
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { exchangeRatesSyncService } from '../service/exchange-rates-sync.service';

TaskManager.defineTask(EXCHANGE_RATE_SYNC_TASK, async () => {
    try {
        await exchangeRatesSyncService();

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

 
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';

export const unregisterExchangeRateSyncTask = async (): Promise<void> => {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK);

        if (!isRegistered) {
            return;
        }

        await BackgroundFetch.unregisterTaskAsync(EXCHANGE_RATE_SYNC_TASK);
    } catch {
        // Ignore errors
    }
};

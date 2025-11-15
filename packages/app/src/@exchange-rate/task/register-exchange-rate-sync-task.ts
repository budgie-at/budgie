 
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { ONE_HOUR_IN_SECONDS } from '../constant/one-hour-in-seconds.constant';

export const registerExchangeRateSyncTask = async (): Promise<void> => {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK);

        if (isRegistered) {
            return;
        }

        await BackgroundFetch.registerTaskAsync(EXCHANGE_RATE_SYNC_TASK, {
            minimumInterval: ONE_HOUR_IN_SECONDS,
            stopOnTerminate: false,
            startOnBoot: true
        });
    } catch {
        // Ignore errors
    }
};

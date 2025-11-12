 
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { syncExchangeRates } from '../service/exchange-rate-sync.service';

export const EXCHANGE_RATE_SYNC_TASK = 'EXCHANGE_RATE_SYNC_TASK';
const ONE_HOUR_IN_SECONDS = 60 * 60;

TaskManager.defineTask(EXCHANGE_RATE_SYNC_TASK, async () => {
    try {
        await syncExchangeRates();

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

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

export const isExchangeRateSyncTaskRegistered = async (): Promise<boolean> => {
    try {
        return await TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK);
    } catch {
        return false;
    }
};

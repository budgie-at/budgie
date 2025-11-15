 
import * as TaskManager from 'expo-task-manager';

import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';

export const isExchangeRateSyncTaskRegistered = async (): Promise<boolean> => {
    try {
        return await TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK);
    } catch {
        return false;
    }
};

import { getLogger } from '@budgie/logger';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { authService } from '../../auth/service/auth.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';
import { monobankSyncService } from '../../sync/service/monobank-sync.service';
import { syncWorkloadService } from '../../sync/service/sync-workload.service';
import { transferConsolidationService } from '../../sync/service/transfer-consolidation.service';

const logger = getLogger('useAppInitialization');

const handleInitializationError = (error: unknown): void => {
    logger.error('failed', { errorMessage: getErrorMessage(error) });
};

const runInitializationTask = (task: Promise<unknown>): void => {
    void task.catch(handleInitializationError);
};

const registerBackgroundTasks = async (): Promise<void> => {
    await authService.ensurePinBackgroundAccessibility();
    await exchangeRatesSyncService.registerBackgroundTask();
    await accountBalanceIncrementalService.registerBackgroundTask();
    await transferConsolidationService.registerBackgroundTask();
    await monobankSyncService.registerBackgroundTask();
};

const syncAppData = async (): Promise<void> => {
    await monobankSyncService.sync();
    await exchangeRatesSyncService.sync();
    await accountBalanceIncrementalService.updateAllBalances(false);
};

const initializeAppServices = async (): Promise<void> => {
    await registerBackgroundTasks();
    await syncWorkloadService.run('startup', syncAppData);
};

export const useAppInitialization = (success: boolean) => {
    useEffect(() => {
        if (success) {
            runInitializationTask(initializeAppServices());
            setTimeout(() => void SplashScreen.hideAsync(), 200);
        }
    }, [success]);
};

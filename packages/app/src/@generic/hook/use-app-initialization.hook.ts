import { getLogger } from '@budgie/logger';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';
import { monobankSyncService } from '../../sync/service/monobank-sync.service';
import { transferConsolidationService } from '../../sync/service/transfer-consolidation.service';

const logger = getLogger('useAppInitialization');

const handleInitializationError = (error: unknown): void => {
    logger.error('failed', { errorMessage: getErrorMessage(error) });
};

const runInitializationTask = (task: Promise<unknown>): void => {
    void task.catch(handleInitializationError);
};

export const useAppInitialization = (success: boolean) => {
    useEffect(() => {
        if (success) {
            try {
                runInitializationTask(exchangeRatesSyncService.sync());
                runInitializationTask(exchangeRatesSyncService.registerBackgroundTask());

                runInitializationTask(accountBalanceIncrementalService.updateAllBalances(false));
                runInitializationTask(accountBalanceIncrementalService.registerBackgroundTask());

                runInitializationTask(monobankSyncService.sync());
                runInitializationTask(monobankSyncService.registerBackgroundTask());

                runInitializationTask(transferConsolidationService.registerBackgroundTask());
            } catch (error: unknown) {
                handleInitializationError(error);
            } finally {
                setTimeout(() => void SplashScreen.hideAsync(), 200);
            }
        }
    }, [success]);
};

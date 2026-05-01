import { getLogger } from '@budgie/logger';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';
import { monobankSyncService } from '../../sync/service/monobank-sync.service';
import { transferConsolidationService } from '../../sync/service/transfer-consolidation.service';

const logger = getLogger('useAppInitialization');

export const useAppInitialization = (success: boolean) => {
    useEffect(() => {
        const init = async () => {
            if (success) {
                try {
                    void exchangeRatesSyncService.sync();
                    void exchangeRatesSyncService.registerBackgroundTask();

                    void accountBalanceIncrementalService.updateAllBalances(false);
                    void accountBalanceIncrementalService.registerBackgroundTask();

                    void monobankSyncService.sync();
                    void monobankSyncService.registerBackgroundTask();

                    void transferConsolidationService.registerBackgroundTask();
                } catch (error: unknown) {
                    logger.error('failed', { errorMessage: getErrorMessage(error) });
                } finally {
                    setTimeout(() => void SplashScreen.hideAsync(), 200);
                }
            }
        };

        void init();
    }, [success]);
};

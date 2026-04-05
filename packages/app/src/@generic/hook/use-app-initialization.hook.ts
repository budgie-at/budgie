import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';
import { monobankSyncService } from '../../sync/service/monobank-sync.service';
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
                } catch (e: unknown) {
                    // eslint-disable-next-line no-console
                    console.log(getErrorMessage(e));
                } finally {
                    setTimeout(() => void SplashScreen.hideAsync(), 200);
                }
            }
        };

        void init();
    }, [success]);
};

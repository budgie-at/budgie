import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';
import { monobankSyncService } from '../../sync/service/monobank-sync.service';
import { expoDb, initPostMigration } from '../drizzle/db/db';

export const useAppInitialization = (success: boolean) => {
    useEffect(() => {
        // eslint-disable-next-line max-statements -- Debug timing logs
        const init = async () => {
            if (success) {
                // eslint-disable-next-line no-console
                console.log('[appInit] useAppInitialization START'); // eslint-disable-line lingui/no-unlocalized-strings
                const totalStart = performance.now();

                try {
                    let stepStart = performance.now();
                    initPostMigration(expoDb);
                    // eslint-disable-next-line no-console
                    console.log(`[appInit] initPostMigration: ${Math.round(performance.now() - stepStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings

                    stepStart = performance.now();
                    void exchangeRatesSyncService.sync();
                    void exchangeRatesSyncService.registerBackgroundTask();
                    // eslint-disable-next-line no-console
                    console.log(`[appInit] exchangeRates fire: ${Math.round(performance.now() - stepStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings

                    stepStart = performance.now();
                    void accountBalanceIncrementalService.updateAllBalances(false);
                    void accountBalanceIncrementalService.registerBackgroundTask();
                    // eslint-disable-next-line no-console
                    console.log(`[appInit] accountBalance fire: ${Math.round(performance.now() - stepStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings

                    stepStart = performance.now();
                    void monobankSyncService.sync();
                    void monobankSyncService.registerBackgroundTask();
                    // eslint-disable-next-line no-console
                    console.log(`[appInit] monobankSync fire: ${Math.round(performance.now() - stepStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings
                } catch (e: unknown) {
                    // eslint-disable-next-line no-console
                    console.log(getErrorMessage(e));
                } finally {
                    // eslint-disable-next-line no-console
                    console.log(`[appInit] useAppInitialization TOTAL: ${Math.round(performance.now() - totalStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings
                    setTimeout(() => void SplashScreen.hideAsync(), 200);
                }
            }
        };

        void init();
    }, [success]);
};

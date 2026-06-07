import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { authService } from '../../auth/service/auth.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';
import { historicalMarketDataLoaderService } from '../../market-data/service/historical-market-data-loader.service';
import { binanceSyncService } from '../../sync/service/binance-sync.service';
import { monobankSyncService } from '../../sync/service/monobank-sync.service';
import { syncWorkloadService } from '../../sync/service/sync-workload.service';
import { transferConsolidationService } from '../../sync/service/transfer-consolidation.service';
import { scheduleIdleCallback } from '../utils/schedule-idle-callback.util';

const SPLASH_HIDE_DELAY_MS = 200;
const STARTUP_SERVICE_DELAY_MS = 1_000;

const syncAppData = async (): Promise<void> => {
    await exchangeRatesSyncService.sync().catch(emptyFn);
    await monobankSyncService.sync().catch(emptyFn);
    await binanceSyncService.sync().catch(emptyFn);
    await accountBalanceIncrementalService.updateAllBalances(false).catch(emptyFn);
};

const initializeAppServices = async (): Promise<void> => {
    await authService.ensurePinBackgroundAccessibility().catch(emptyFn);
    await exchangeRatesSyncService.registerBackgroundTask().catch(emptyFn);
    await accountBalanceIncrementalService.registerBackgroundTask().catch(emptyFn);
    await transferConsolidationService.registerBackgroundTask().catch(emptyFn);
    await monobankSyncService.registerBackgroundTask().catch(emptyFn);
    await binanceSyncService.registerBackgroundTask().catch(emptyFn);
    await syncWorkloadService.run('startup', syncAppData);
    void historicalMarketDataLoaderService.enqueueActiveAccounts().catch(emptyFn);
};

const scheduleAppServicesInitialization = (): (() => void) => {
    let cancelIdleCallback: () => void = emptyFn;

    const timer = setTimeout(() => {
        cancelIdleCallback = scheduleIdleCallback(() => {
            void initializeAppServices().catch(emptyFn);
        });
    }, STARTUP_SERVICE_DELAY_MS);

    return () => {
        clearTimeout(timer);
        cancelIdleCallback();
    };
};

export const useAppInitialization = (success: boolean) => {
    useEffect(() => {
        if (!success) {
            return emptyFn;
        }

        const cancelAppServicesInitialization = scheduleAppServicesInitialization();
        const splashHideTimer = setTimeout(() => void SplashScreen.hideAsync(), SPLASH_HIDE_DELAY_MS);

        return () => {
            cancelAppServicesInitialization();
            clearTimeout(splashHideTimer);
        };
    }, [success]);
};

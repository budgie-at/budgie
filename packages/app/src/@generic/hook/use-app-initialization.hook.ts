import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { authService } from '../../auth/service/auth.service';
import { budgetAlertMonitorService } from '../../budget/service/budget-alert-monitor.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';
import { historicalMarketDataLoaderService } from '../../market-data/service/historical-market-data-loader.service';
import { onboardingService } from '../../onboarding/service/onboarding.service';
import { appDataSyncService } from '../../sync/service/app-data-sync.service';
import { binanceSyncService } from '../../sync/service/binance-sync.service';
import { monobankSyncService } from '../../sync/service/monobank-sync.service';
import { transferConsolidationService } from '../../sync/service/transfer-consolidation.service';
import { widgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { appRuntime } from '../runtime/app.runtime';
import { Workload } from '../service/workload.service';
import { waitForIdle } from '../utils/wait-for-idle.util';

const SPLASH_HIDE_DELAY_MS = 200;
const STARTUP_SERVICE_DELAY_MS = 1_000;

const logAndContinue = Effect.catchCause(Effect.logError);

const initializeAppServices = Effect.gen(function* () {
    yield* Effect.all(
        [
            authService.ensurePinBackgroundAccessibility(),
            exchangeRatesSyncService.registerBackgroundTask(),
            accountBalanceIncrementalService.registerBackgroundTask(),
            transferConsolidationService.registerBackgroundTask(),
            monobankSyncService.registerBackgroundTask(),
            binanceSyncService.registerBackgroundTask(),
            budgetAlertMonitorService.registerBackgroundTask(),
            widgetSnapshotService.registerBackgroundTask()
        ].map(logAndContinue),
        { concurrency: 'unbounded', discard: true }
    );
    widgetSnapshotService.start();
    yield* Workload.use(workload => workload.run(appDataSyncService.sync()));
    yield* logAndContinue(onboardingService.initializeLocale());
    yield* logAndContinue(historicalMarketDataLoaderService.enqueueActiveAccounts());
});

const scheduleAppServicesInitialization = Effect.sleep(STARTUP_SERVICE_DELAY_MS).pipe(
    Effect.andThen(waitForIdle),
    Effect.andThen(Effect.forkDetach(logAndContinue(initializeAppServices)))
);

export const useAppInitialization = (success: boolean) => {
    useEffect(() => {
        if (!success) {
            return emptyFn;
        }

        const appServicesInitialization = appRuntime.runFork(scheduleAppServicesInitialization);
        const splashHideTimer = setTimeout(() => void SplashScreen.hideAsync(), SPLASH_HIDE_DELAY_MS);

        return () => {
            appRuntime.runFork(Fiber.interrupt(appServicesInitialization));
            clearTimeout(splashHideTimer);
        };
    }, [success]);
};

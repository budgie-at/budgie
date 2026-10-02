import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { AuthService } from '../../auth/service/auth.service';
import { BudgetAlertMonitorService } from '../../budget/service/budget-alert-monitor.service';
import { ExchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';
import { HistoricalMarketDataLoaderService } from '../../market-data/service/historical-market-data-loader.service';
import { OnboardingService } from '../../onboarding/service/onboarding.service';
import { AppDataSyncService } from '../../sync/service/app-data-sync.service';
import { BinanceSyncService } from '../../sync/service/binance-sync.service';
import { MonobankSyncService } from '../../sync/service/monobank-sync.service';
import { TransferConsolidationService } from '../../sync/service/transfer-consolidation.service';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { appRuntime } from '../runtime/app.runtime';
import { Workload } from '../service/workload.service';
import { logAndContinue } from '../utils/log-and-continue.util';
import { waitForIdle } from '../utils/wait-for-idle.util';

const SPLASH_HIDE_DELAY_MS = 200;
const STARTUP_SERVICE_DELAY_MS = 1_000;

const registerBackgroundTasks = Effect.gen(function* () {
    const authService = yield* AuthService;
    const exchangeRatesSyncService = yield* ExchangeRatesSyncService;
    const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
    const transferConsolidationService = yield* TransferConsolidationService;
    const monobankSyncService = yield* MonobankSyncService;
    const binanceSyncService = yield* BinanceSyncService;
    const budgetAlertMonitorService = yield* BudgetAlertMonitorService;
    const widgetSnapshotService = yield* WidgetSnapshotService;

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
});

const initializeAppServices = Effect.gen(function* () {
    const widgetSnapshotService = yield* WidgetSnapshotService;
    const workload = yield* Workload;
    const appDataSyncService = yield* AppDataSyncService;
    const onboardingService = yield* OnboardingService;
    const historicalMarketDataLoaderService = yield* HistoricalMarketDataLoaderService;

    yield* registerBackgroundTasks;
    yield* widgetSnapshotService.start();
    yield* logAndContinue(workload.run(appDataSyncService.sync()));
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

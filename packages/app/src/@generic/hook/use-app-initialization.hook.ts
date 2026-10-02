import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as BackgroundTask from 'expo-background-task';
import * as SplashScreen from 'expo-splash-screen';
import * as TaskManager from 'expo-task-manager';
import { useEffect } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../../account/constant/account-balance-incremental-task.constant';
import { AuthService } from '../../auth/service/auth.service';
import { BudgetAlertMonitorService } from '../../budget/service/budget-alert-monitor.service';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';
import { HistoricalMarketDataDrainerService } from '../../market-data/service/historical-market-data-drainer.service';
import { OnboardingService } from '../../onboarding/service/onboarding.service';
import { BINANCE_SYNC_TASK } from '../../sync/constant/binance-sync-task.constant';
import { MONOBANK_SYNC_TASK } from '../../sync/constant/monobank-sync-task.constant';
import { TRANSFER_CONSOLIDATION_TASK } from '../../sync/constant/transfer-consolidation-task.constant';
import { AppDataSyncService } from '../../sync/service/app-data-sync.service';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { appRuntime } from '../runtime/app.runtime';
import { Workload } from '../service/workload.service';
import { logAndContinue } from '../utils/log-and-continue.util';
import { waitForIdle } from '../utils/wait-for-idle.util';

const SPLASH_HIDE_DELAY_MS = 200;
const STARTUP_SERVICE_DELAY_MS = 1_000;
const ACCOUNT_BALANCE_INCREMENTAL_TASK_MINIMUM_INTERVAL_MINUTES = 7 * 24 * 60;
const TRANSFER_CONSOLIDATION_TASK_MINIMUM_INTERVAL_MINUTES = 30;
const PROVIDER_SYNC_TASK_MINIMUM_INTERVAL_MINUTES = 15;

const registerTaskOnce = Effect.fnUntraced(function* (taskName: string, minimumInterval: number) {
    if (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(taskName))) {
        return;
    }

    yield* Effect.promise(() => BackgroundTask.registerTaskAsync(taskName, { minimumInterval }));
});

const reregisterTask = Effect.fnUntraced(function* (taskName: string, minimumInterval: number) {
    if (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(taskName))) {
        yield* Effect.promise(() => BackgroundTask.unregisterTaskAsync(taskName));
    }

    yield* Effect.promise(() => BackgroundTask.registerTaskAsync(taskName, { minimumInterval }));
});

const registerBackgroundTasks = Effect.gen(function* () {
    const authService = yield* AuthService;
    const exchangeRateBackgroundService = yield* ExchangeRateBackgroundService;
    const budgetAlertMonitorService = yield* BudgetAlertMonitorService;
    const widgetSnapshotService = yield* WidgetSnapshotService;

    yield* Effect.all(
        [
            authService.ensurePinBackgroundAccessibility(),
            exchangeRateBackgroundService.registerBackgroundTask(),
            registerTaskOnce(ACCOUNT_BALANCE_INCREMENTAL_TASK, ACCOUNT_BALANCE_INCREMENTAL_TASK_MINIMUM_INTERVAL_MINUTES),
            registerTaskOnce(TRANSFER_CONSOLIDATION_TASK, TRANSFER_CONSOLIDATION_TASK_MINIMUM_INTERVAL_MINUTES),
            reregisterTask(MONOBANK_SYNC_TASK, PROVIDER_SYNC_TASK_MINIMUM_INTERVAL_MINUTES),
            reregisterTask(BINANCE_SYNC_TASK, PROVIDER_SYNC_TASK_MINIMUM_INTERVAL_MINUTES),
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
    const historicalMarketDataDrainerService = yield* HistoricalMarketDataDrainerService;

    yield* registerBackgroundTasks;
    yield* widgetSnapshotService.start();
    yield* logAndContinue(workload.run(appDataSyncService.sync()));
    yield* logAndContinue(onboardingService.initializeLocale());
    yield* logAndContinue(historicalMarketDataDrainerService.enqueueActiveAccounts());
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

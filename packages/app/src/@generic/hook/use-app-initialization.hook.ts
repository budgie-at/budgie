import { BudgetPeriodCloseService } from '@budgie/budget';
import { CloudSyncService } from '@budgie/cloud-sync';
import { SyncIdentityRepository, logAndContinue } from '@budgie/contracts';
import { YieldTagRepairService } from '@budgie/sync';
import { i18n } from '@lingui/core';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { AuthService } from '../../auth/service/auth.service';
import { BROKERAGE_FUNDING_TITLE } from '../../brokerage/constant/brokerage-funding-title.constant';
import { BrokerageService } from '../../brokerage/service/brokerage.service';
import { CategoryIconBackfillService } from '../../category/service/category-icon-backfill.service';
import { CloudBackupTriggerService } from '../../cloud-backup/service/cloud-backup-trigger.service';
import { InzhurPendingTopUpService } from '../../inzhur/service/inzhur-pending-top-up.service';
import { InzhurStatementReminderService } from '../../inzhur/service/inzhur-statement-reminder.service';
import { HistoricalMarketDataDrainerService } from '../../market-data/service/historical-market-data-drainer.service';
import { OnboardingService } from '../../onboarding/service/onboarding.service';
import { AppDataSyncService } from '../../sync/service/app-data-sync.service';
import { BackgroundSyncSessionService } from '../../sync/service/background-sync-session.service';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { appAtomRegistry } from '../constant/app-atom-registry.constant';
import { splashScreenHiddenAtom } from '../constant/splash-screen-hidden-atom.constant';
import { appRuntime } from '../runtime/app.runtime';
import { BackgroundTaskCoordinatorService } from '../service/background-task-coordinator.service';
import { Workload } from '../service/workload.service';
import { waitForIdle } from '../utils/wait-for-idle.util';

const SPLASH_HIDE_DELAY_MS = 200;
const STARTUP_SERVICE_DELAY_MS = 1_000;

const registerBackgroundTasks = Effect.gen(function* () {
    const authService = yield* AuthService;
    const backgroundTaskCoordinatorService = yield* BackgroundTaskCoordinatorService;
    const inzhurStatementReminderService = yield* InzhurStatementReminderService;
    const inzhurPendingTopUpService = yield* InzhurPendingTopUpService;

    yield* Effect.forEach(
        [
            authService.ensurePinBackgroundAccessibility(),
            backgroundTaskCoordinatorService.register(),
            inzhurStatementReminderService.start,
            inzhurPendingTopUpService.start
        ],
        logAndContinue,
        { concurrency: 'unbounded', discard: true }
    );
});

const startCloudServices = Effect.gen(function* () {
    const cloudBackupTriggerService = yield* Effect.serviceOption(CloudBackupTriggerService);

    if (Option.isSome(cloudBackupTriggerService)) {
        yield* logAndContinue(cloudBackupTriggerService.value.start());
    }

    yield* logAndContinue((yield* Workload).run((yield* SyncIdentityRepository).backfill()));

    const cloudSyncService = yield* Effect.serviceOption(CloudSyncService);

    if (Option.isSome(cloudSyncService)) {
        yield* logAndContinue(cloudSyncService.value.start());
    }
});

const initializeAppServices = Effect.gen(function* () {
    const widgetSnapshotService = yield* WidgetSnapshotService;
    const workload = yield* Workload;
    const appDataSyncService = yield* AppDataSyncService;
    const onboardingService = yield* OnboardingService;
    const backgroundSyncSessionService = yield* BackgroundSyncSessionService;

    yield* Effect.forkDetach(appDataSyncService.drainWalletCapturesOnInvocation);
    yield* registerBackgroundTasks;
    yield* widgetSnapshotService.start();
    yield* backgroundSyncSessionService.start();
    yield* startCloudServices;

    yield* logAndContinue(workload.run(appDataSyncService.sync()));
    yield* logAndContinue(
        Effect.flatMap(BudgetPeriodCloseService, service =>
            Effect.flatMap(DateTime.nowAsDate, now => workload.run(service.closeDuePeriods(now)))
        )
    );
    yield* logAndContinue(onboardingService.initializeLocale());
    yield* Effect.all(
        [
            logAndContinue(Effect.flatMap(HistoricalMarketDataDrainerService, service => service.enqueueActiveAccounts())),
            logAndContinue(Effect.flatMap(YieldTagRepairService, service => workload.run(service.runOnce()))),
            logAndContinue(
                Effect.flatMap(BrokerageService, service => workload.run(service.reconcileFunding(i18n._(BROKERAGE_FUNDING_TITLE))))
            )
        ],
        { discard: true }
    );
    yield* logAndContinue((yield* CategoryIconBackfillService).applyConfidentIcons());
});

const scheduleAppServicesInitialization = Effect.sleep(STARTUP_SERVICE_DELAY_MS).pipe(
    Effect.andThen(waitForIdle),
    Effect.andThen(initializeAppServices.pipe(logAndContinue, Effect.forkDetach))
);

const hideSplashScreen = Effect.sleep(SPLASH_HIDE_DELAY_MS).pipe(
    Effect.andThen(
        Effect.promise(() => SplashScreen.hideAsync()).pipe(
            Effect.ensuring(Effect.sync(() => void appAtomRegistry.set(splashScreenHiddenAtom, true)))
        )
    )
);

const startup = Effect.all([logAndContinue(scheduleAppServicesInitialization), logAndContinue(hideSplashScreen)], {
    concurrency: 'unbounded',
    discard: true
});

export const useAppInitialization = (success: boolean) => {
    useEffect(() => {
        if (!success) {
            return emptyFn;
        }

        const startupFiber = appRuntime.runFork(startup);

        return () => void startupFiber.interruptUnsafe();
    }, [success]);
};

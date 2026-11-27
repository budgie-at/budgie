import { BudgetPeriodCloseService } from '@budgie/budget';
import { ExternalSourceEnum, SyncRepository, logAndContinue } from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransferConsolidationService } from '@budgie/ledger';
import { RecurringRefreshService } from '@budgie/recurring';
import { BinanceSyncService, EnableBankingSyncService, MonobankSyncService } from '@budgie/sync';
import { millisecondsInDay, millisecondsInHour, millisecondsInMinute } from 'date-fns/constants';
import * as Cause from 'effect/Cause';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BackgroundSyncModule } from '../../../modules/background-sync';
import { BudgetAlertMonitorService } from '../../budget/service/budget-alert-monitor.service';
import { CloudBackupService } from '../../cloud-backup/service/cloud-backup.service';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';
import { RecurringReminderService } from '../../recurring/service/recurring-reminder.service';
import { SiriCatalogService } from '../../siri/service/siri-catalog.service';
import { BackgroundSyncSessionService } from '../../sync/service/background-sync-session.service';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { APP_BACKGROUND_TASK } from '../constant/app-background-task.constant';
import { DatabaseMigrationService } from '../drizzle/service/database-migration.service';
import { NativeCallError } from '../error/native-call.error';
import { makeLazyStorage } from '../utils/make-lazy-storage.util';

import { Workload } from './workload.service';

import type { Db } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

export class BackgroundTaskCoordinatorService extends Context.Service<BackgroundTaskCoordinatorService>()(
    '@budgie/app/BackgroundTaskCoordinatorService',
    {
        make: Effect.gen(function* () {
            const databaseMigrationService = yield* DatabaseMigrationService;
            const workload = yield* Workload;
            const syncRepository = yield* SyncRepository;
            const backgroundSyncSessionService = yield* BackgroundSyncSessionService;
            const monobankSyncService = yield* MonobankSyncService;
            const binanceSyncService = yield* BinanceSyncService;
            const enableBankingSyncService = yield* EnableBankingSyncService;
            const recurringRefreshService = yield* RecurringRefreshService;
            const recurringReminderService = yield* RecurringReminderService;
            const budgetPeriodCloseService = yield* BudgetPeriodCloseService;
            const budgetAlertMonitorService = yield* BudgetAlertMonitorService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const exchangeRateBackgroundService = yield* ExchangeRateBackgroundService;
            const widgetSnapshotService = yield* WidgetSnapshotService;
            const siriCatalogService = yield* SiriCatalogService;

            const getScheduleStorage = yield* makeLazyStorage('background-task-schedule.sqlite');

            const minimumIntervalMinutes = 15;
            const monobankBudgetMs = 130_000;
            const providerSyncBudgetMs = 25_000;
            const transferConsolidationIntervalMs = 30 * millisecondsInMinute;
            const exchangeRateIntervalMs = millisecondsInHour;
            const widgetSnapshotIntervalMs = millisecondsInHour;
            const cloudBackupIntervalMs = millisecondsInDay;
            const accountBalanceIntervalMs = 7 * millisecondsInDay;
            const legacyTaskNames = [
                'ACCOUNT_BALANCE_INCREMENTAL_TASK',
                'BUDGET_ALERT_MONITOR_TASK',
                'CLOUD_BACKUP_TASK',
                'EXCHANGE_RATE_SYNC_TASK',
                'binance-sync-task',
                'enable-banking-sync-task',
                'monobank-sync-task',
                'transfer-consolidation-task',
                'widget-snapshot-task'
            ] as const;

            const readLastRunAt = (key: string) =>
                Effect.tryPromise({
                    try: () => getScheduleStorage().getItem(key),
                    catch: cause => NativeCallError.make({ cause })
                }).pipe(
                    Effect.map(raw => {
                        if (!isDefined(raw)) {
                            return null;
                        }
                        const parsed = Number(raw);

                        return Number.isFinite(parsed) ? parsed : null;
                    })
                );

            const writeLastRunAt = (key: string, nowMs: number) =>
                Effect.tryPromise({
                    try: () => getScheduleStorage().setItem(key, String(nowMs)),
                    catch: cause => NativeCallError.make({ cause })
                });

            const isDue = (lastRunAt: number | null, nowMs: number, intervalMs: number): boolean =>
                !isDefined(lastRunAt) || nowMs < lastRunAt || nowMs - lastRunAt >= intervalMs;

            const runIfDue = <E, R>(key: string, intervalMs: number, effect: Effect.Effect<unknown, E, R>) =>
                logAndContinue(
                    Effect.gen(function* () {
                        const [lastRunAt, nowMs] = yield* Effect.all([readLastRunAt(key), Clock.currentTimeMillis]);
                        if (!isDue(lastRunAt, nowMs, intervalMs)) {
                            return;
                        }

                        yield* effect;
                        yield* writeLastRunAt(key, nowMs);
                    })
                );

            const runProviderSync = <E>(
                runSync: (deadlineAtMs: number) => Effect.Effect<boolean, E, Db | HttpClient.HttpClient | Workload>,
                budgetMs: number
            ) =>
                workload
                    .run(Effect.flatMap(Clock.currentTimeMillis, startedAtMs => runSync(startedAtMs + budgetMs)))
                    .pipe(
                        Effect.catchCause(cause =>
                            Cause.hasInterruptsOnly(cause) ? Effect.interrupt : Effect.as(Effect.logError(cause), false)
                        )
                    );

            const runBankSyncs = Effect.fnUntraced(function* () {
                const isSyncSessionActive = yield* backgroundSyncSessionService.isActive;
                const activeBackwardProviders = isSyncSessionActive
                    ? new Set((yield* syncRepository.getAllPendingBackwardSyncs).map(sync => sync.provider))
                    : new Set<ExternalSourceEnum>();

                const monobankOk = activeBackwardProviders.has(ExternalSourceEnum.MONOBANK)
                    ? true
                    : yield* runProviderSync(deadline => monobankSyncService.sync(deadline), monobankBudgetMs);
                const binanceOk = activeBackwardProviders.has(ExternalSourceEnum.BINANCE)
                    ? true
                    : yield* runProviderSync(deadline => binanceSyncService.sync(deadline), providerSyncBudgetMs);
                const enableBankingOk = activeBackwardProviders.has(ExternalSourceEnum.ENABLE_BANKING)
                    ? true
                    : yield* runProviderSync(deadline => enableBankingSyncService.sync(deadline), providerSyncBudgetMs);
                const now = yield* DateTime.nowAsDate;
                yield* logAndContinue(
                    workload.run(recurringRefreshService.matchRecent(now).pipe(Effect.andThen(recurringReminderService.reschedule(now))))
                );

                return monobankOk && binanceOk && enableBankingOk;
            });

            const withAndroidTimerKeepAlive = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> => {
                const nativeModule = BackgroundSyncModule;
                if (Platform.OS !== 'android' || !isDefined(nativeModule)) {
                    return effect;
                }

                return Effect.acquireUseRelease(
                    Effect.promise(() => nativeModule.acquireTimerKeepAlive()).pipe(logAndContinue),
                    () => effect,
                    () => Effect.promise(() => nativeModule.releaseTimerKeepAlive()).pipe(logAndContinue)
                );
            };

            return {
                register: Effect.fn('BackgroundTaskCoordinatorService.register')(function* () {
                    let hadLegacyTasks = false;
                    for (const legacyTaskName of legacyTaskNames) {
                        const isRegistered = yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(legacyTaskName));
                        if (isRegistered) {
                            hadLegacyTasks = true;
                            yield* Effect.promise(() => BackgroundTask.unregisterTaskAsync(legacyTaskName));
                        }
                    }

                    const options = yield* Effect.promise(() =>
                        TaskManager.getTaskOptionsAsync<BackgroundTask.BackgroundTaskOptions | null>(APP_BACKGROUND_TASK)
                    );

                    if (!hadLegacyTasks && options?.minimumInterval === minimumIntervalMinutes) {
                        return;
                    }

                    if (isDefined(options)) {
                        yield* Effect.promise(() => BackgroundTask.unregisterTaskAsync(APP_BACKGROUND_TASK));
                    }

                    yield* Effect.promise(() =>
                        BackgroundTask.registerTaskAsync(APP_BACKGROUND_TASK, { minimumInterval: minimumIntervalMinutes })
                    );
                }),
                run: Effect.fn('BackgroundTaskCoordinatorService.run')(function* () {
                    return yield* withAndroidTimerKeepAlive(
                        Effect.gen(function* () {
                            yield* databaseMigrationService.migrate();

                            const isBankSyncSuccess = yield* runBankSyncs();

                            const now = yield* DateTime.nowAsDate;
                            yield* logAndContinue(budgetPeriodCloseService.closeDuePeriods(now));
                            yield* logAndContinue(budgetAlertMonitorService.run());

                            yield* runIfDue(
                                'transferConsolidationAt',
                                transferConsolidationIntervalMs,
                                workload.run(transferConsolidationService.consolidate(null))
                            );
                            yield* runIfDue('exchangeRateAt', exchangeRateIntervalMs, workload.run(exchangeRateBackgroundService.sync));

                            if (Platform.OS === 'ios') {
                                yield* runIfDue(
                                    'widgetSnapshotAt',
                                    widgetSnapshotIntervalMs,
                                    Effect.andThen(widgetSnapshotService.publish(), logAndContinue(siriCatalogService.publish()))
                                );
                            }

                            yield* Effect.serviceOption(CloudBackupService).pipe(
                                Effect.flatMap(option =>
                                    Option.isSome(option) ? workload.run(option.value.backup(cloudBackupIntervalMs)) : Effect.void
                                ),
                                logAndContinue
                            );
                            yield* runIfDue(
                                'accountBalanceAt',
                                accountBalanceIntervalMs,
                                workload.run(accountBalanceIncrementalService.updateAllBalances(false))
                            );

                            return isBankSyncSuccess
                                ? BackgroundTask.BackgroundTaskResult.Success
                                : BackgroundTask.BackgroundTaskResult.Failed;
                        })
                    );
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(BackgroundTaskCoordinatorService, BackgroundTaskCoordinatorService.make).pipe(
        Layer.provide([
            DatabaseMigrationService.layer,
            Workload.layer,
            SyncRepository.layer,
            BackgroundSyncSessionService.layer,
            MonobankSyncService.layer,
            BinanceSyncService.layer,
            EnableBankingSyncService.layer,
            RecurringRefreshService.layer,
            RecurringReminderService.layer,
            BudgetPeriodCloseService.layer,
            BudgetAlertMonitorService.layer,
            TransferConsolidationService.layer,
            AccountBalanceIncrementalService.layer,
            ExchangeRateBackgroundService.layer,
            WidgetSnapshotService.layer,
            SiriCatalogService.layer
        ])
    );
}

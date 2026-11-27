import { BudgetPeriodCloseService } from '@budgie/budget';
import { logAndContinue } from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransferConsolidationService } from '@budgie/ledger';
import { RecurringRefreshService } from '@budgie/recurring';
import { BinanceSyncService, EnableBankingSyncService, MonobankSyncService } from '@budgie/sync';
import { millisecondsInDay, millisecondsInHour, millisecondsInMinute } from 'date-fns/constants';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as BackgroundTask from 'expo-background-task';
import { File, Paths } from 'expo-file-system';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BudgetAlertMonitorService } from '../../budget/service/budget-alert-monitor.service';
import { CloudBackupService } from '../../cloud-backup/service/cloud-backup.service';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';
import { RecurringReminderService } from '../../recurring/service/recurring-reminder.service';
import { SiriCatalogService } from '../../siri/service/siri-catalog.service';
import { BackgroundSyncSessionService } from '../../sync/service/background-sync-session.service';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { APP_BACKGROUND_TASK } from '../constant/app-background-task.constant';
import { DatabaseMigrationService } from '../drizzle/service/database-migration.service';

import { Workload } from './workload.service';

import type { Db } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

export class BackgroundTaskCoordinatorService extends Context.Service<BackgroundTaskCoordinatorService>()(
    '@budgie/app/BackgroundTaskCoordinatorService',
    {
        make: Effect.gen(function* () {
            const databaseMigrationService = yield* DatabaseMigrationService;
            const workload = yield* Workload;
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

            const ScheduleSchema = Schema.fromJsonString(
                Schema.Struct({
                    transferConsolidationAt: Schema.NullOr(Schema.Finite),
                    exchangeRateAt: Schema.NullOr(Schema.Finite),
                    widgetSnapshotAt: Schema.NullOr(Schema.Finite),
                    cloudBackupAt: Schema.NullOr(Schema.Finite),
                    accountBalanceAt: Schema.NullOr(Schema.Finite)
                })
            );
            const emptySchedule: typeof ScheduleSchema.Type = {
                transferConsolidationAt: null,
                exchangeRateAt: null,
                widgetSnapshotAt: null,
                cloudBackupAt: null,
                accountBalanceAt: null
            };
            const scheduleFile = () => new File(Paths.document, 'background-task-schedule.json');
            const temporaryFile = () => new File(Paths.document, 'background-task-schedule.json.tmp');

            const readSchedule = Effect.sync((): typeof ScheduleSchema.Type => {
                const committedFile = scheduleFile();
                const recoveryFile = temporaryFile();

                if (committedFile.exists) {
                    const committed = Schema.decodeOption(ScheduleSchema)(committedFile.textSync());
                    if (Option.isSome(committed)) {
                        return committed.value;
                    }
                }

                if (recoveryFile.exists) {
                    const recovered = Schema.decodeOption(ScheduleSchema)(recoveryFile.textSync());
                    if (Option.isSome(recovered)) {
                        recoveryFile.moveSync(committedFile, { overwrite: true });

                        return recovered.value;
                    }
                }

                return emptySchedule;
            });

            const writeSchedule = Effect.fnUntraced(function* (schedule: typeof ScheduleSchema.Type) {
                const encoded = yield* Schema.encodeEffect(ScheduleSchema)(schedule).pipe(Effect.orDie);

                yield* Effect.sync(() => {
                    const pendingFile = temporaryFile();
                    pendingFile.create({ overwrite: true });
                    pendingFile.writeSync(encoded);
                    pendingFile.moveSync(scheduleFile(), { overwrite: true });
                });
            });

            const markJobRan = (key: keyof typeof ScheduleSchema.Type, nowMs: number) =>
                Effect.flatMap(readSchedule, schedule => writeSchedule({ ...schedule, [key]: nowMs }));

            const isDue = (lastRunAt: number | null, nowMs: number, intervalMs: number): boolean =>
                !isDefined(lastRunAt) || nowMs - lastRunAt >= intervalMs;

            const runIfDue = <E, R>(key: keyof typeof ScheduleSchema.Type, intervalMs: number, effect: Effect.Effect<unknown, E, R>) =>
                Effect.gen(function* () {
                    const [schedule, nowMs] = yield* Effect.all([readSchedule, Clock.currentTimeMillis]);
                    if (!isDue(schedule[key], nowMs, intervalMs)) {
                        return;
                    }

                    yield* logAndContinue(effect.pipe(Effect.tap(() => markJobRan(key, nowMs))));
                });

            const runProviderSync = <E>(
                runSync: (deadlineAtMs: number) => Effect.Effect<boolean, E, Db | HttpClient.HttpClient | Workload>,
                budgetMs: number
            ) =>
                workload
                    .run(Effect.flatMap(Clock.currentTimeMillis, startedAtMs => runSync(startedAtMs + budgetMs)))
                    .pipe(Effect.catchCause(cause => Effect.as(Effect.logError(cause), false)));

            const runBankSyncs = Effect.fnUntraced(function* () {
                const isSyncSessionActive = yield* backgroundSyncSessionService.isActive;
                if (isSyncSessionActive) {
                    return true;
                }

                const monobankOk = yield* runProviderSync(deadline => monobankSyncService.sync(deadline), monobankBudgetMs);
                const binanceOk = yield* runProviderSync(deadline => binanceSyncService.sync(deadline), providerSyncBudgetMs);
                const enableBankingOk = yield* runProviderSync(deadline => enableBankingSyncService.sync(deadline), providerSyncBudgetMs);
                const now = yield* DateTime.nowAsDate;
                yield* logAndContinue(
                    workload.run(recurringRefreshService.matchRecent(now).pipe(Effect.andThen(recurringReminderService.reschedule(now))))
                );

                return monobankOk && binanceOk && enableBankingOk;
            });

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

                    yield* runIfDue(
                        'cloudBackupAt',
                        cloudBackupIntervalMs,
                        Effect.flatMap(Effect.serviceOption(CloudBackupService), option =>
                            Option.isSome(option) ? workload.run(option.value.backup(cloudBackupIntervalMs)) : Effect.void
                        )
                    );
                    yield* runIfDue(
                        'accountBalanceAt',
                        accountBalanceIntervalMs,
                        workload.run(accountBalanceIncrementalService.updateAllBalances(false))
                    );

                    return isBankSyncSuccess ? BackgroundTask.BackgroundTaskResult.Success : BackgroundTask.BackgroundTaskResult.Failed;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(BackgroundTaskCoordinatorService, BackgroundTaskCoordinatorService.make).pipe(
        Layer.provide([
            DatabaseMigrationService.layer,
            Workload.layer,
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

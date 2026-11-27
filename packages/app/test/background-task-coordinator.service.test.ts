import { BudgetPeriodCloseService } from '@budgie/budget';
import { AccountBalanceIncrementalService, TransferConsolidationService } from '@budgie/ledger';
import { RecurringRefreshService } from '@budgie/recurring';
import { BinanceSyncService, EnableBankingSyncService, MonobankSyncService } from '@budgie/sync';
import { beforeEach, describe, expect, it } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';
import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { APP_BACKGROUND_TASK } from '../src/@generic/constant/app-background-task.constant';
import { DatabaseMigrationService } from '../src/@generic/drizzle/service/database-migration.service';
import { BackgroundTaskCoordinatorService } from '../src/@generic/service/background-task-coordinator.service';
import { Workload } from '../src/@generic/service/workload.service';
import { BudgetAlertMonitorService } from '../src/budget/service/budget-alert-monitor.service';
import { CloudBackupService } from '../src/cloud-backup/service/cloud-backup.service';
import { ExchangeRateBackgroundService } from '../src/exchange-rate/service/exchange-rate-background.service';
import { RecurringReminderService } from '../src/recurring/service/recurring-reminder.service';
import { SiriCatalogService } from '../src/siri/service/siri-catalog.service';
import { BackgroundSyncSessionService } from '../src/sync/service/background-sync-session.service';
import { WidgetSnapshotService } from '../src/widget/service/widget-snapshot.service';

import { resetStorage } from './fixture/expo-file-system-fake';
import { inertDbLayer } from './fixture/inert-db-layer';

const { tagModule, backgroundTaskMocks, taskManagerMocks } = vi.hoisted(() => ({
    tagModule: async (name: string) => {
        const Context = await import('effect/Context');
        const LayerModule = await import('effect/Layer');

        return Object.assign(Context.Service<object>(`test/${name}`), { layer: LayerModule.empty });
    },
    backgroundTaskMocks: {
        BackgroundTaskResult: { Success: 1, Failed: 2 },
        registerTaskAsync: vi.fn(() => Promise.resolve(undefined)),
        unregisterTaskAsync: vi.fn((_taskName: string) => Promise.resolve(undefined))
    },
    taskManagerMocks: {
        isTaskRegisteredAsync: vi.fn((_name: string) => Promise.resolve(false)),
        getTaskOptionsAsync: vi.fn((_name: string) => Promise.resolve<{ minimumInterval?: number } | null>(null))
    }
}));

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));
vi.mock('expo-file-system', () => import('./fixture/expo-file-system-fake'));
vi.mock('react-native', () => ({ Platform: { OS: 'ios', constants: {} } }));
vi.mock('expo-background-task', () => backgroundTaskMocks);
vi.mock('expo-task-manager', () => taskManagerMocks);
vi.mock('../src/@generic/drizzle/service/database-migration.service', async () => ({
    DatabaseMigrationService: await tagModule('DatabaseMigrationService')
}));
vi.mock('../src/sync/service/background-sync-session.service', async () => ({
    BackgroundSyncSessionService: await tagModule('BackgroundSyncSessionService')
}));
vi.mock('../src/recurring/service/recurring-reminder.service', async () => ({
    RecurringReminderService: await tagModule('RecurringReminderService')
}));
vi.mock('../src/budget/service/budget-alert-monitor.service', async () => ({
    BudgetAlertMonitorService: await tagModule('BudgetAlertMonitorService')
}));
vi.mock('../src/exchange-rate/service/exchange-rate-background.service', async () => ({
    ExchangeRateBackgroundService: await tagModule('ExchangeRateBackgroundService')
}));
vi.mock('../src/widget/service/widget-snapshot.service', async () => ({
    WidgetSnapshotService: await tagModule('WidgetSnapshotService')
}));
vi.mock('../src/siri/service/siri-catalog.service', async () => ({
    SiriCatalogService: await tagModule('SiriCatalogService')
}));
vi.mock('../src/cloud-backup/service/cloud-backup.service', async () => ({
    CloudBackupService: await tagModule('CloudBackupService')
}));

interface CallRecordInterface {
    readonly calls: string[];
    readonly monobankDeadlines: Array<{ readonly startedAtMs: number; readonly deadlineAtMs: number }>;
    readonly cloudBackupMinAges: number[];
    syncSessionActive: boolean;
}

const createState = (): CallRecordInterface => ({
    calls: [],
    monobankDeadlines: [],
    cloudBackupMinAges: [],
    syncSessionActive: false
});

const expectNotCalled = (state: CallRecordInterface, jobs: readonly string[]) => {
    for (const job of jobs) {
        expect(state.calls).not.toContain(job);
    }
};

const makeCoordinatorLayer = (state: CallRecordInterface) => {
    const record = (name: string) => Effect.sync(() => void state.calls.push(name));

    const stubDependencies = Layer.mergeAll(
        Layer.mock(DatabaseMigrationService)({ migrate: () => record('migrate') }),
        Layer.mock(BackgroundSyncSessionService)({ isActive: Effect.sync(() => state.syncSessionActive) }),
        Layer.mock(MonobankSyncService)({
            sync: deadlineAtMs =>
                Effect.gen(function* () {
                    const startedAtMs = yield* Clock.currentTimeMillis;
                    state.calls.push('monobank');
                    state.monobankDeadlines.push({ startedAtMs, deadlineAtMs: deadlineAtMs ?? 0 });

                    return true;
                })
        }),
        Layer.mock(BinanceSyncService)({ sync: () => record('binance').pipe(Effect.as(true)) }),
        Layer.mock(EnableBankingSyncService)({ sync: () => record('enableBanking').pipe(Effect.as(true)) }),
        Layer.mock(RecurringRefreshService)({ matchRecent: () => record('recurringRefresh').pipe(Effect.as(0)) }),
        Layer.mock(RecurringReminderService)({ reschedule: () => record('recurringReminder') }),
        Layer.mock(BudgetPeriodCloseService)({ closeDuePeriods: () => record('budgetPeriodClose').pipe(Effect.as(0)) }),
        Layer.mock(BudgetAlertMonitorService)({ run: () => record('budgetAlertMonitor') }),
        Layer.mock(TransferConsolidationService)({
            consolidate: () => record('transferConsolidation').pipe(Effect.as({ found: 0, consolidated: 0 }))
        }),
        Layer.mock(AccountBalanceIncrementalService)({ updateAllBalances: () => record('accountBalance').pipe(Effect.as(0)) }),
        Layer.mock(ExchangeRateBackgroundService)({ sync: record('exchangeRate') }),
        Layer.mock(WidgetSnapshotService)({ publish: () => record('widgetSnapshot').pipe(Effect.as(true)), unlock: emptyFn }),
        Layer.mock(SiriCatalogService)({ publish: () => record('siriCatalog') }),
        Layer.mock(CloudBackupService)({
            backup: minAgeMs =>
                Effect.sync(() => {
                    state.calls.push('cloudBackup');
                    state.cloudBackupMinAges.push(minAgeMs);

                    return true;
                })
        })
    );

    const workloadLayer = Workload.layer.pipe(Layer.provideMerge(Layer.mergeAll(inertDbLayer, FetchHttpClient.layer)));

    return Layer.effect(BackgroundTaskCoordinatorService, BackgroundTaskCoordinatorService.make).pipe(
        Layer.provideMerge(Layer.mergeAll(workloadLayer, stubDependencies))
    );
};

describe('BackgroundTaskCoordinatorService', () => {
    beforeEach(() => {
        resetStorage();
        backgroundTaskMocks.registerTaskAsync.mockClear();
        backgroundTaskMocks.unregisterTaskAsync.mockClear();
        taskManagerMocks.isTaskRegisteredAsync.mockReset();
        taskManagerMocks.isTaskRegisteredAsync.mockImplementation(() => Promise.resolve(false));
        taskManagerMocks.getTaskOptionsAsync.mockReset();
        taskManagerMocks.getTaskOptionsAsync.mockImplementation(() => Promise.resolve(null));
    });

    it.effect('unregisters legacy tasks and stale app-background-task before registering app-background-task', () =>
        Effect.gen(function* () {
            const legacyTasks = new Set(['monobank-sync-task', 'CLOUD_BACKUP_TASK', 'ACCOUNT_BALANCE_INCREMENTAL_TASK']);
            taskManagerMocks.isTaskRegisteredAsync.mockImplementation(name => Promise.resolve(legacyTasks.has(name)));
            taskManagerMocks.getTaskOptionsAsync.mockImplementation(() => Promise.resolve({ minimumInterval: 30 }));

            const coordinator = yield* BackgroundTaskCoordinatorService;
            yield* coordinator.register();

            expect(backgroundTaskMocks.unregisterTaskAsync.mock.calls.map(call => call[0])).toEqual([
                'ACCOUNT_BALANCE_INCREMENTAL_TASK',
                'CLOUD_BACKUP_TASK',
                'monobank-sync-task',
                APP_BACKGROUND_TASK
            ]);
            expect(backgroundTaskMocks.registerTaskAsync).toHaveBeenCalledTimes(1);
            expect(backgroundTaskMocks.registerTaskAsync).toHaveBeenCalledWith(APP_BACKGROUND_TASK, { minimumInterval: 15 });
        }).pipe(Effect.provide(makeCoordinatorLayer(createState())))
    );

    it.effect('is a no-op when no legacy tasks exist and app-background-task already has minimumInterval 15', () =>
        Effect.gen(function* () {
            taskManagerMocks.isTaskRegisteredAsync.mockImplementation(() => Promise.resolve(false));
            taskManagerMocks.getTaskOptionsAsync.mockImplementation(name =>
                Promise.resolve(name === APP_BACKGROUND_TASK ? { minimumInterval: 15 } : null)
            );

            const coordinator = yield* BackgroundTaskCoordinatorService;
            yield* coordinator.register();

            expect(backgroundTaskMocks.unregisterTaskAsync).not.toHaveBeenCalled();
            expect(backgroundTaskMocks.registerTaskAsync).not.toHaveBeenCalled();
        }).pipe(Effect.provide(makeCoordinatorLayer(createState())))
    );

    it.effect(
        'migrates first, computes Monobank 130s deadline inside workload.run after lane wait, then runs Binance and Enable Banking',
        () =>
            Effect.gen(function* () {
                const state = createState();
                const layer = makeCoordinatorLayer(state);

                yield* Effect.gen(function* () {
                    const coordinator = yield* BackgroundTaskCoordinatorService;
                    const workload = yield* Workload;
                    const laneAcquired = yield* Deferred.make<void>();

                    const laneHolder = yield* workload
                        .run(Deferred.succeed(laneAcquired, undefined).pipe(Effect.andThen(Effect.sleep('20 seconds'))))
                        .pipe(Effect.forkChild);
                    yield* Deferred.await(laneAcquired);

                    const coordinatorRun = yield* coordinator.run().pipe(Effect.forkChild);
                    for (let attempt = 0; attempt < 50 && !(yield* workload.hasQueuedWork); attempt += 1) {
                        yield* Effect.yieldNow;
                    }
                    expect(state.calls).toEqual(['migrate']);

                    yield* TestClock.adjust('20 seconds');
                    yield* Fiber.join(laneHolder);
                    const result = yield* Fiber.join(coordinatorRun);

                    expect(result).toBe(backgroundTaskMocks.BackgroundTaskResult.Success);
                    expect(state.monobankDeadlines).toHaveLength(1);
                    expect(state.monobankDeadlines[0].startedAtMs).toBe(20_000);
                    expect(state.monobankDeadlines[0].deadlineAtMs - state.monobankDeadlines[0].startedAtMs).toBe(130_000);
                    expect(state.calls.slice(0, 4)).toEqual(['migrate', 'monobank', 'binance', 'enableBanking']);
                }).pipe(Effect.provide(layer));
            })
    );

    it.effect('skips bank syncs when BackgroundSyncSessionService is active', () =>
        Effect.gen(function* () {
            const state = createState();
            state.syncSessionActive = true;
            const layer = makeCoordinatorLayer(state);

            const result = yield* Effect.flatMap(BackgroundTaskCoordinatorService, service => service.run()).pipe(Effect.provide(layer));

            expect(result).toBe(backgroundTaskMocks.BackgroundTaskResult.Success);
            expect(state.calls).not.toContain('monobank');
            expect(state.calls).not.toContain('binance');
            expect(state.calls).not.toContain('enableBanking');
            expect(state.calls).not.toContain('recurringRefresh');
            expect(state.calls).toContain('migrate');
            expect(state.calls).toContain('budgetAlertMonitor');
        })
    );

    it.effect('respects per-job cadences across consecutive wakes', () =>
        Effect.gen(function* () {
            const state = createState();
            const layer = makeCoordinatorLayer(state);
            const runWake = Effect.gen(function* () {
                state.calls.splice(0);
                const coordinator = yield* BackgroundTaskCoordinatorService;

                return yield* coordinator.run();
            });

            yield* TestClock.setTime(1_000_000_000_000);

            yield* Effect.gen(function* () {
                yield* runWake;
                expect(state.calls).toContain('transferConsolidation');
                expect(state.calls).toContain('exchangeRate');
                expect(state.calls).toContain('widgetSnapshot');
                expect(state.calls).toContain('cloudBackup');
                expect(state.calls).toContain('accountBalance');
                expect(state.cloudBackupMinAges).toEqual([24 * 60 * 60 * 1000]);

                yield* TestClock.adjust('15 minutes');
                yield* runWake;
                expect(state.calls).toContain('budgetAlertMonitor');
                expectNotCalled(state, ['transferConsolidation', 'exchangeRate', 'widgetSnapshot', 'cloudBackup', 'accountBalance']);

                yield* TestClock.adjust('15 minutes');
                yield* runWake;
                expect(state.calls).toContain('transferConsolidation');
                expectNotCalled(state, ['exchangeRate', 'widgetSnapshot', 'cloudBackup', 'accountBalance']);

                yield* TestClock.adjust('30 minutes');
                yield* runWake;
                expect(state.calls).toContain('exchangeRate');
                expect(state.calls).toContain('widgetSnapshot');
                expectNotCalled(state, ['cloudBackup', 'accountBalance']);

                yield* TestClock.adjust('23 hours');
                yield* runWake;
                expect(state.calls).toContain('cloudBackup');
                expect(state.calls).not.toContain('accountBalance');

                yield* TestClock.adjust('6 days');
                yield* runWake;
                expect(state.calls).toContain('accountBalance');
            }).pipe(Effect.provide(layer));
        })
    );
});

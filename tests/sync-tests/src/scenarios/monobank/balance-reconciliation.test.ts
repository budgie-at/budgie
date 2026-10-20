import {
    AccountTypeEnum,
    ExternalSourceEnum,
    SyncModeEnum,
    SyncRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { MonobankSyncService, ResyncService, SyncBalanceReconciliationService, TransferConsolidationService } from '@budgie/sync';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as FiberSet from 'effect/FiberSet';

import { buildMonobank, fetchAccountBalance, monobankStub, seed, skipRequestedSync, testDb, TestLayer } from '../../harness';

import type { Services } from '../../harness/scenario/test-runtime';
import type { Account, StatementItem } from '@liaugust/monobank-sdk';

const MS_PER_SECOND = 1_000;
const SECONDS_PER_HOUR = 3_600;
const MICRO_UNITS_PER_KOPECK = 10_000;
const nowSeconds = () => Math.floor(Date.now() / MS_PER_SECOND);
const hoursAgo = (hours: number) => nowSeconds() - hours * SECONDS_PER_HOUR;
const toMicroUnits = (kopecks: number) => kopecks * MICRO_UNITS_PER_KOPECK;

const seedForwardAccount = Effect.fnUntraced(function* (externalId: string) {
    const account = yield* seed.account({
        externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: 1
    });
    yield* seed.sync({
        accountId: account.id,
        forwardSyncFromAt: new Date((nowSeconds() - 24 * SECONDS_PER_HOUR) * MS_PER_SECOND),
        mode: SyncModeEnum.FORWARD,
        provider: ExternalSourceEnum.MONOBANK
    });

    return account;
});

const syncWithBank = Effect.fnUntraced(function* (bankAccount: Account, statement: StatementItem[]) {
    const monobankSyncService = yield* MonobankSyncService;

    monobankStub.clientInfo(buildMonobank.clientInfo({ accounts: [bankAccount], jars: [] }));
    monobankStub.statement(statement);
    yield* monobankSyncService.sync();
});

const fetchAdjustments = (accountId: number) =>
    testDb
        .select({ amount: TransactionEntryEntityTable.amount, type: TransactionEntryEntityTable.type })
        .from(TransactionEntryEntityTable)
        .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
        .where(and(eq(TransactionEntryEntityTable.accountId, accountId), eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT)));

const fetchSync = Effect.fnUntraced(function* (accountId: number) {
    const syncRepository = yield* SyncRepository;

    return yield* syncRepository.getByAccountId(accountId);
});

const expectSmallDriftApplied = Effect.fnUntraced(function* (accountId: number) {
    expect(yield* fetchAdjustments(accountId)).toStrictEqual([{ amount: toMicroUnits(50), type: TransactionEntryTypeEnum.CREDIT }]);
    expect(yield* fetchAccountBalance(accountId)).toBe(toMicroUnits(-20_050));
});

const expense = (id: string, kopecks: number, hours: number, balance: number) =>
    buildMonobank.transaction({ id, amount: -kopecks, hold: false, time: hoursAgo(hours), balance });

describe('monobank/balance-reconciliation', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('auto-applies a small drift after the forward sync catches up', () =>
        Effect.gen(function* () {
            const account = yield* seedForwardAccount('mono-small-drift');

            yield* syncWithBank(buildMonobank.account({ id: 'mono-small-drift', balance: -20_050 }), [
                expense('small-1', 20_000, 1, -20_050)
            ]);

            yield* expectSmallDriftApplied(account.id);
            expect(yield* fetchSync(account.id)).toMatchObject({ reconciledBalance: toMicroUnits(-20_050), pendingReconciliationAt: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('is idempotent across repeated runs with an unchanged bank balance', () =>
        Effect.gen(function* () {
            const account = yield* seedForwardAccount('mono-idempotent');
            const bankAccount = buildMonobank.account({ id: 'mono-idempotent', balance: -20_050 });

            yield* syncWithBank(bankAccount, [expense('idem-1', 20_000, 1, -20_050)]);
            yield* syncWithBank(bankAccount, []);
            yield* syncWithBank(bankAccount, []);

            yield* expectSmallDriftApplied(account.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('surfaces a missing opening above the threshold for approval and applies it once approved', () =>
        Effect.gen(function* () {
            const syncBalanceReconciliationService = yield* SyncBalanceReconciliationService;
            const account = yield* seedForwardAccount('mono-missing-opening');

            yield* syncWithBank(buildMonobank.account({ id: 'mono-missing-opening', balance: 80_000 }), [
                expense('opening-1', 20_000, 1, 80_000)
            ]);

            expect(yield* fetchAdjustments(account.id)).toStrictEqual([]);
            expect(yield* fetchAccountBalance(account.id)).toBe(toMicroUnits(-20_000));
            expect(yield* syncBalanceReconciliationService.getPendingReview(account.id)).toMatchObject({
                delta: toMicroUnits(100_000)
            });

            yield* syncBalanceReconciliationService.approve(account.id);

            expect(yield* fetchAdjustments(account.id)).toStrictEqual([
                { amount: toMicroUnits(100_000), type: TransactionEntryTypeEnum.DEBIT }
            ]);
            expect(yield* fetchAccountBalance(account.id)).toBe(toMicroUnits(80_000));
            expect(yield* syncBalanceReconciliationService.getPendingReview(account.id)).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('points the review at the first statement item where the bank and the ledger diverged', () =>
        Effect.gen(function* () {
            const syncBalanceReconciliationService = yield* SyncBalanceReconciliationService;
            const account = yield* seedForwardAccount('mono-drift-start');
            const divergedItem = expense('start-2', 5_000, 2, 4_000);

            yield* syncWithBank(buildMonobank.account({ id: 'mono-drift-start', balance: 1_000 }), [
                expense('start-3', 3_000, 1, 1_000),
                divergedItem,
                buildMonobank.transaction({ id: 'start-1', amount: 10_000, hold: false, time: hoursAgo(3), balance: 10_000 })
            ]);

            expect(yield* syncBalanceReconciliationService.getPendingReview(account.id)).toStrictEqual({
                delta: toMicroUnits(-1_000),
                driftStartAt: new Date(divergedItem.time * MS_PER_SECOND)
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('compares credit cards by own funds when the credit limit changes', () =>
        Effect.gen(function* () {
            const account = yield* seedForwardAccount('mono-credit-limit');
            const income = buildMonobank.transaction({ id: 'credit-1', amount: 20_000, hold: false, time: hoursAgo(1), balance: 120_000 });

            yield* syncWithBank(buildMonobank.account({ id: 'mono-credit-limit', balance: 120_000, creditLimit: 100_000 }), [income]);
            yield* syncWithBank(buildMonobank.account({ id: 'mono-credit-limit', balance: 170_000, creditLimit: 150_000 }), []);

            expect(yield* fetchAdjustments(account.id)).toStrictEqual([]);
            expect(yield* fetchAccountBalance(account.id)).toBe(toMicroUnits(20_000));
            expect(yield* fetchSync(account.id)).toMatchObject({ reconciledBalance: toMicroUnits(20_000), pendingReconciliationAt: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-bases the adjustment when backfill inserts an entry before the reconciliation point', () =>
        Effect.gen(function* () {
            const resyncService = yield* ResyncService;
            const monobankSyncService = yield* MonobankSyncService;
            const account = yield* seedForwardAccount('mono-backfill');
            const recentExpense = expense('backfill-2', 20_000, 1, -20_050);

            yield* syncWithBank(buildMonobank.account({ id: 'mono-backfill', balance: -20_050 }), [recentExpense]);
            yield* skipRequestedSync(resyncService.resync({ accountId: account.id, sinceDays: 3 }));
            monobankStub.clientInfo(buildMonobank.clientInfo({ accounts: [], jars: [] }));
            monobankStub.statement([recentExpense, expense('backfill-1', 50, 48, -50)]);
            yield* monobankSyncService.sync();

            expect(yield* fetchAdjustments(account.id)).toStrictEqual([]);
            expect(yield* fetchAccountBalance(account.id)).toBe(toMicroUnits(-20_050));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not reconcile while the account syncs history backward', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const runPromise = yield* FiberSet.makeRuntimePromise<Services>();
            const reconciledDuringBackward: Array<Date | null | undefined> = [];
            const account = yield* seed.account({ externalId: 'mono-backward', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            yield* seed.sync({
                accountId: account.id,
                mode: SyncModeEnum.BACKWARD,
                backwardSyncFromAt: new Date(),
                backwardSyncLimitAt: new Date(hoursAgo(24 * 90) * MS_PER_SECOND),
                forwardSyncFromAt: new Date(),
                setupBalance: toMicroUnits(50_000)
            });

            monobankStub.clientInfo(
                buildMonobank.clientInfo({ accounts: [buildMonobank.account({ id: 'mono-backward', balance: 50_000 })], jars: [] })
            );
            monobankStub.statementThen([expense('backward-1', 20_000, 48, 50_000)], () =>
                runPromise(
                    Effect.map(fetchSync(account.id), sync => {
                        if (sync?.mode === SyncModeEnum.BACKWARD) {
                            reconciledDuringBackward.push(sync.reconciledAt);
                        }
                    })
                )
            );
            yield* monobankSyncService.sync();

            expect(reconciledDuringBackward.length).toBeGreaterThan(0);
            expect(reconciledDuringBackward.every(reconciledAt => reconciledAt === null)).toBe(true);
            expect(yield* fetchSync(account.id)).toMatchObject({ mode: SyncModeEnum.FORWARD, reconciledBalance: toMicroUnits(50_000) });
            expect(yield* fetchAccountBalance(account.id)).toBe(toMicroUnits(50_000));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not reconcile when the batch consolidation did not finish', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const monobankSyncService = yield* MonobankSyncService;
            const account = yield* seedForwardAccount('mono-consolidation');
            vi.spyOn(transferConsolidationService, 'consolidate').mockReturnValue(Effect.die(new Error('consolidation interrupted')));

            monobankStub.clientInfo(
                buildMonobank.clientInfo({ accounts: [buildMonobank.account({ id: 'mono-consolidation', balance: -20_050 })], jars: [] })
            );
            monobankStub.statement([expense('consolidation-1', 20_000, 1, -20_050)]);
            yield* monobankSyncService.sync(Date.now() + MS_PER_SECOND);

            expect(yield* fetchSync(account.id)).toMatchObject({ reconciledAt: null, pendingReconciliationAt: null });
            expect(yield* fetchAdjustments(account.id)).toStrictEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});

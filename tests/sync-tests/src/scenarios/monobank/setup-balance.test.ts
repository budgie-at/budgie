import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { SyncHistoryDepthEnum } from '@app/sync/enum/sync-history-depth.enum';
import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { ResyncService } from '@app/sync/service/resync.service';
import {
    AccountBalanceRepository,
    AccountRepository,
    ExternalSourceEnum,
    SyncModeEnum,
    SyncRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as FiberSet from 'effect/FiberSet';

import { emptyFn } from '@rnw-community/shared';

import { buildMonobank, inWorkload, monobankStub, seed, skipRequestedSync, testDb, TestLayer } from '../../harness';

import type { Services } from '../../harness/scenario/test-runtime';
import type { AccountEntityInterface } from '@budgie/contracts';
import type { Account } from '@liaugust/monobank-sdk';

const HISTORY_TIME = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60;
const HISTORY = [buildMonobank.transaction({ id: 'history-expense', amount: -20_000, hold: false, time: HISTORY_TIME })];
const HISTORY_LEDGER = -200_000_000;

const setupMonobankSync = Effect.fnUntraced(function* (bankAccount: Account) {
    const monobankSyncService = yield* MonobankSyncService;
    const accountRepository = yield* AccountRepository;

    monobankStub.clientInfo(buildMonobank.clientInfo({ accounts: [bankAccount], jars: [] }));
    yield* skipRequestedSync(monobankSyncService.setupAccountSyncBatch('test-token', [bankAccount.id], SyncHistoryDepthEnum.MONTHS_3));
    const [account]: AccountEntityInterface[] = yield* accountRepository.findByExternalIds([bankAccount.id]);

    return account;
});

const fetchBalanceAdjustments = (accountId: number) =>
    Effect.gen(function* () {
        return yield* testDb
            .select({
                amount: TransactionEntryEntityTable.amount,
                type: TransactionEntryEntityTable.type,
                operatedAt: TransactionEntityTable.operatedAt
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
            .where(
                and(eq(TransactionEntryEntityTable.accountId, accountId), eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT))
            );
    });

const readBalance = Effect.fnUntraced(function* (accountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return (yield* accountBalanceRepository.getByAccountId(accountId)).at(0)?.balance;
});

const importHistory = Effect.fnUntraced(function* (onLaterRequest: () => Promise<void> | void = emptyFn) {
    const monobankSyncService = yield* MonobankSyncService;

    monobankStub.statementThen(HISTORY, onLaterRequest);
    yield* monobankSyncService.sync();
});

const expectReconciledTo = Effect.fnUntraced(function* (accountId: number, setupBalance: number) {
    expect(yield* fetchBalanceAdjustments(accountId)).toStrictEqual([expect.objectContaining({ amount: setupBalance - HISTORY_LEDGER })]);
    expect(yield* readBalance(accountId)).toBe(setupBalance);
});

describe('monobank/setup-balance', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('shows the setup balance during import, then books one opening adjustment before the oldest transaction', () =>
        Effect.gen(function* () {
            const runPromise = yield* FiberSet.makeRuntimePromise<Services>();
            const account = yield* setupMonobankSync(buildMonobank.account({ id: 'mono-setup', balance: 150_000 }));
            const balancesDuringImport = new Set([yield* readBalance(account.id)]);

            yield* importHistory(() =>
                runPromise(
                    Effect.map(readBalance(account.id), balance => {
                        balancesDuringImport.add(balance);
                    })
                )
            );

            expect(balancesDuringImport).toStrictEqual(new Set([1_500_000_000]));
            yield* expectReconciledTo(account.id, 1_500_000_000);
            expect((yield* fetchBalanceAdjustments(account.id))[0]).toMatchObject({
                type: TransactionEntryTypeEnum.DEBIT,
                operatedAt: new Date((HISTORY_TIME - 1) * 1000)
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books no correction for matching history or when a fully synced account is added again', () =>
        Effect.gen(function* () {
            const bankAccount = buildMonobank.account({ id: 'mono-match', balance: -20_000 });
            const account = yield* setupMonobankSync(bankAccount);
            yield* importHistory();

            yield* setupMonobankSync({ ...bankAccount, balance: 50_000 });
            yield* importHistory();

            expect(yield* fetchBalanceAdjustments(account.id)).toStrictEqual([]);
            expect(yield* readBalance(account.id)).toBe(HISTORY_LEDGER);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('shows own money without the credit limit for credit cards', () =>
        Effect.gen(function* () {
            const account = yield* setupMonobankSync(
                buildMonobank.account({ id: 'mono-credit', balance: 1_200_000, creditLimit: 1_000_000 })
            );
            const balanceBeforeImport = yield* readBalance(account.id);

            yield* importHistory();

            expect(balanceBeforeImport).toBe(2_000_000_000);
            yield* expectReconciledTo(account.id, 2_000_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the setup balance while paused mid-import and reconciles only after resuming', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const runPromise = yield* FiberSet.makeRuntimePromise<Services>();
            const account = yield* setupMonobankSync(buildMonobank.account({ id: 'mono-pause', balance: 150_000 }));
            yield* importHistory(() => runPromise(monobankSyncService.setAccountSyncEnabled(account.id, false)));
            const pausedBalance = yield* readBalance(account.id);
            const pausedAdjustments = yield* fetchBalanceAdjustments(account.id);

            monobankStub.statementThen([], emptyFn);
            yield* skipRequestedSync(monobankSyncService.setAccountSyncEnabled(account.id, true));
            yield* monobankSyncService.sync();

            expect(pausedBalance).toBe(1_500_000_000);
            expect(pausedAdjustments).toStrictEqual([]);
            yield* expectReconciledTo(account.id, 1_500_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rolls back a reconciliation interrupted after its writes and books it once on retry', () =>
        Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const runPromise = yield* FiberSet.makeRuntimePromise<Services>();
            const account = yield* setupMonobankSync(buildMonobank.account({ id: 'mono-retry', balance: 150_000 }));
            const adjustmentCountsBeforeCompletion: number[] = [];

            yield* importHistory(() =>
                runPromise(
                    Effect.gen(function* () {
                        adjustmentCountsBeforeCompletion.push((yield* fetchBalanceAdjustments(account.id)).length);
                        if (!vi.isMockFunction(accountBalanceIncrementalService.updateBalancesByAccountIds)) {
                            vi.spyOn(accountBalanceIncrementalService, 'updateBalancesByAccountIds').mockReturnValueOnce(
                                Effect.die(new Error('app suspended'))
                            );
                        }
                    })
                )
            );

            expect(adjustmentCountsBeforeCompletion.slice(0, 3)).toStrictEqual([0, 0, 0]);
            yield* expectReconciledTo(account.id, 1_500_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fails a full resync visibly when Monobank is unreachable and otherwise replaces the adjustment', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const resyncService = yield* ResyncService;
            const syncRepository = yield* SyncRepository;
            const bankAccount = buildMonobank.account({ id: 'mono-resync', balance: 150_000 });
            const account = yield* setupMonobankSync(bankAccount);
            yield* importHistory();

            monobankStub.clientInfoFailure();
            const failedResync = yield* Effect.exit(resyncService.resync({ accountId: account.id, sinceDays: null }));
            expect(Exit.isFailure(failedResync)).toBe(true);
            const failedResyncMode = (yield* syncRepository.getByAccountId(account.id))?.mode;

            monobankStub.clientInfo(buildMonobank.clientInfo({ accounts: [{ ...bankAccount, balance: 100_000 }], jars: [] }));
            monobankStub.statementThen(HISTORY, emptyFn);
            yield* resyncService.resync({ accountId: account.id, sinceDays: null });
            yield* inWorkload(Effect.void);
            yield* monobankSyncService.sync();

            expect(failedResyncMode).toBe(SyncModeEnum.FORWARD);
            yield* expectReconciledTo(account.id, 1_000_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('resyncs a Binance account fully without capturing a Monobank setup balance', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const resyncService = yield* ResyncService;
            const syncRepository = yield* SyncRepository;
            const account = yield* seed.account({ externalId: 'binance-spot' });
            yield* seed.sync({ accountId: account.id, provider: ExternalSourceEnum.BINANCE });
            const fetchSetupBalanceSpy = vi.spyOn(monobankSyncService, 'fetchSetupBalance');

            yield* resyncService.resync({ accountId: account.id, sinceDays: null });

            expect(fetchSetupBalanceSpy).not.toHaveBeenCalled();
            expect(yield* syncRepository.getByAccountId(account.id)).toMatchObject({
                mode: SyncModeEnum.BACKWARD,
                setupBalance: null
            });
        }).pipe(Effect.provide(TestLayer))
    );
});

import {
    ACCOUNT_DELETED_TRANSFER_CATEGORY_ID,
    AccountBalanceRepository,
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { ResyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchTransactionById, seed, testDb, TestLayer } from '../../harness';

const OPERATED_AT = new Date(2025, 5, 1, 12, 0, 0);

const seedTransfer = (sourceAccountId: number, targetAccountId: number, amount: number) =>
    seed.directTransfer({
        exchangeRate: 1,
        operatedAt: OPERATED_AT,
        sourceAccountId,
        sourceAmount: amount,
        sourceEntryExchangeRate: 1,
        targetAccountId,
        targetAmount: amount,
        toIban: null
    });

const seedHiddenTransferChild = (archivedAccountId: number, bankAccountId: number, cashAccountId: number) =>
    Effect.gen(function* () {
        const amount = 70 * PRECISION;
        const child = yield* seedTransfer(archivedAccountId, cashAccountId, amount);
        const canonical = yield* seed.directTransfer({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            exchangeRate: 1,
            operatedAt: OPERATED_AT,
            sourceAccountId: bankAccountId,
            sourceAmount: amount,
            sourceEntryExchangeRate: 1,
            targetAccountId: cashAccountId,
            targetAmount: amount,
            toIban: null
        });

        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ transactionId: canonical.id, originalTransactionId: child.id })
            .where(and(eq(TransactionEntryEntityTable.transactionId, child.id), eq(TransactionEntryEntityTable.accountId, cashAccountId)));
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: new Date() })
            .where(
                and(eq(TransactionEntryEntityTable.transactionId, child.id), eq(TransactionEntryEntityTable.accountId, archivedAccountId))
            );
        yield* testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: canonical.id, consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR })
            .where(eq(TransactionEntityTable.id, child.id));

        const grandchild = yield* seed.bankPairIncome(
            { externalId: 'privat-income', operatedAt: OPERATED_AT },
            { accountId: cashAccountId, amount }
        );

        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ transactionId: child.id, originalTransactionId: grandchild.id })
            .where(eq(TransactionEntryEntityTable.transactionId, grandchild.id));
        yield* testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: child.id })
            .where(eq(TransactionEntityTable.id, grandchild.id));

        return { canonical, child, grandchild };
    });

const fetchEntries = (transactionId: number) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.transactionId, transactionId));

const fetchStatistics = Effect.fnUntraced(function* () {
    const statisticsRepository = yield* StatisticsRepository;
    const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, 1);
    const incomeByCategory = yield* statisticsRepository.getIncomeByCategoryQuery(DEFAULT_TRANSACTION_FILTER, 1, LanguageEnum.EN);
    const expenseByCategory = yield* statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, 1, LanguageEnum.EN);
    const incomeTransactions = yield* statisticsRepository.getIncomeTransactionsQuery(DEFAULT_TRANSACTION_FILTER);
    const expenseTransactions = yield* statisticsRepository.getExpenseTransactionsQuery(DEFAULT_TRANSACTION_FILTER);

    return { totals, incomeByCategory, expenseByCategory, incomeTransactions, expenseTransactions };
});

const expectNestedConsolidationKept = <E, R>(accountLifecycleAction: (accountId: number) => Effect.Effect<void, E, R>) =>
    Effect.gen(function* () {
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const account = yield* seed.account({ title: 'erste bank EUR', type: AccountTypeEnum.BANK });
        const bankAccount = yield* seed.account({ title: 'Erste EUR', type: AccountTypeEnum.BANK });
        const cashAccount = yield* seed.account({ title: 'Cash EUR', type: AccountTypeEnum.CASH });
        const liveAccountIds = [bankAccount.id, cashAccount.id];
        const { canonical, child, grandchild } = yield* seedHiddenTransferChild(account.id, bankAccount.id, cashAccount.id);
        const snapshot = Effect.all({
            grandchild: fetchTransactionById(grandchild.id),
            canonicalEntries: fetchEntries(canonical.id),
            ledger: accountBalanceRepository.getLedgerBalances(liveAccountIds),
            statistics: fetchStatistics()
        });
        const before = yield* snapshot;

        yield* seed.sync({ accountId: account.id, provider: ExternalSourceEnum.BINANCE });
        yield* accountLifecycleAction(account.id);

        expect((yield* fetchTransactionById(child.id)).consolidationParentTransactionId).toBe(canonical.id);
        expect(yield* snapshot).toEqual(before);
    });

describe('account/delete-account-transfer-conversion', () => {
    it.effect('converts only visible transfers into excluded income and expense and leaves hidden and archived ones intact', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const deletedAccount = yield* seed.account({ title: 'erste bank EUR', type: AccountTypeEnum.BANK });
            const otherArchivedAccount = yield* seed.account({ title: 'monobank EUR', type: AccountTypeEnum.BANK });
            const bankAccount = yield* seed.account({ title: 'Erste EUR', type: AccountTypeEnum.BANK });
            const cashAccount = yield* seed.account({ title: 'Cash EUR', type: AccountTypeEnum.CASH });
            const liveAccountIds = [bankAccount.id, cashAccount.id];
            const incomingTransfer = yield* seedTransfer(deletedAccount.id, cashAccount.id, 100 * PRECISION);
            const outgoingTransfer = yield* seedTransfer(bankAccount.id, deletedAccount.id, 40 * PRECISION);
            const archivedTransfer = yield* seedTransfer(deletedAccount.id, otherArchivedAccount.id, 25 * PRECISION);

            yield* accountArchiveService.archiveById(otherArchivedAccount.id);
            yield* accountArchiveService.archiveById(deletedAccount.id);

            const { canonical, child, grandchild } = yield* seedHiddenTransferChild(deletedAccount.id, bankAccount.id, cashAccount.id);

            const ledgerBefore = yield* accountBalanceRepository.getLedgerBalances(liveAccountIds);
            const statisticsBefore = yield* fetchStatistics();
            const archivedTransferBefore = yield* fetchTransactionById(archivedTransfer.id);
            const childBefore = yield* fetchTransactionById(child.id);
            const canonicalEntriesBefore = yield* fetchEntries(canonical.id);
            const childEntriesBefore = yield* fetchEntries(child.id);
            const grandchildBefore = yield* fetchTransactionById(grandchild.id);

            expect(archivedTransferBefore.deletedAt).not.toBeNull();
            expect(childBefore.deletedAt).toBeNull();

            yield* accountArchiveService.deleteById(deletedAccount.id);

            const incoming = yield* fetchTransactionById(incomingTransfer.id);
            const outgoing = yield* fetchTransactionById(outgoingTransfer.id);
            const [incomingEntry] = yield* fetchEntries(incomingTransfer.id);
            const [outgoingEntry] = yield* fetchEntries(outgoingTransfer.id);
            const statisticsAfter = yield* fetchStatistics();

            expect([incoming.type, incoming.fromAccountId, incoming.toAccountId]).toEqual([
                TransactionTypeEnum.INCOME,
                null,
                cashAccount.id
            ]);
            expect([outgoing.type, outgoing.fromAccountId, outgoing.toAccountId]).toEqual([
                TransactionTypeEnum.EXPENSE,
                bankAccount.id,
                null
            ]);
            expect(incomingEntry).toMatchObject({
                accountId: cashAccount.id,
                type: TransactionEntryTypeEnum.DEBIT,
                amount: 100 * PRECISION,
                categoryId: ACCOUNT_DELETED_TRANSFER_CATEGORY_ID
            });
            expect(outgoingEntry).toMatchObject({
                accountId: bankAccount.id,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: 40 * PRECISION,
                categoryId: ACCOUNT_DELETED_TRANSFER_CATEGORY_ID
            });

            expect(yield* fetchTransactionById(archivedTransfer.id)).toEqual({ ...archivedTransferBefore, fromAccountId: null });
            expect(yield* fetchEntries(archivedTransfer.id)).toHaveLength(1);
            expect(yield* fetchTransactionById(child.id)).toEqual({ ...childBefore, fromAccountId: null });
            expect(yield* fetchEntries(canonical.id)).toEqual(canonicalEntriesBefore);
            expect(yield* fetchEntries(child.id)).toEqual(childEntriesBefore.filter(entry => entry.accountId !== deletedAccount.id));
            expect(yield* fetchTransactionById(grandchild.id)).toEqual(grandchildBefore);

            expect(yield* accountBalanceRepository.getLedgerBalances(liveAccountIds)).toEqual(ledgerBefore);
            expect(statisticsAfter).toEqual(statisticsBefore);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps statistics free of a transfer converted on an account deleted without archiving first', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const deletedAccount = yield* seed.account({ title: 'Old card', type: AccountTypeEnum.BANK });
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH });
            const transfer = yield* seedTransfer(cashAccount.id, deletedAccount.id, 12 * PRECISION);
            const statisticsBefore = yield* fetchStatistics();

            yield* accountArchiveService.deleteById(deletedAccount.id);

            expect((yield* fetchTransactionById(transfer.id)).type).toBe(TransactionTypeEnum.EXPENSE);
            expect(yield* fetchStatistics()).toEqual(statisticsBefore);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the archived counterpart entry and hides the transfer when the only live entry sat on the deleted account', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const deletedAccount = yield* seed.account({ title: 'Old card', type: AccountTypeEnum.BANK });
            const archivedAccount = yield* seed.account({ title: 'Archived card', type: AccountTypeEnum.BANK });
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH });
            const transfer = yield* seedTransfer(deletedAccount.id, archivedAccount.id, 30 * PRECISION);

            yield* accountArchiveService.archiveById(archivedAccount.id);

            const archivedEntryBefore = (yield* fetchEntries(transfer.id)).filter(entry => entry.accountId === archivedAccount.id);
            const ledgerBefore = yield* accountBalanceRepository.getLedgerBalances([cashAccount.id]);
            const statisticsBefore = yield* fetchStatistics();

            expect(archivedEntryBefore).toHaveLength(1);
            expect(archivedEntryBefore[0].deletedAt).not.toBeNull();

            yield* accountArchiveService.deleteById(deletedAccount.id);

            const transferAfter = yield* fetchTransactionById(transfer.id);

            expect(transferAfter.deletedAt).not.toBeNull();
            expect(transferAfter.fromAccountId).toBeNull();
            expect(yield* fetchEntries(transfer.id)).toEqual(archivedEntryBefore);
            expect(yield* accountBalanceRepository.getLedgerBalances([cashAccount.id])).toEqual(ledgerBefore);
            expect(yield* fetchStatistics()).toEqual(statisticsBefore);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('archiving an account keeps a consolidation hidden inside another one nested', () =>
        Effect.flatMap(AccountArchiveService, accountArchiveService =>
            expectNestedConsolidationKept(accountId => accountArchiveService.archiveById(accountId))
        ).pipe(Effect.provide(TestLayer))
    );

    it.effect('resyncing an account keeps a consolidation hidden inside another one nested', () =>
        Effect.flatMap(ResyncService, resyncService =>
            expectNestedConsolidationKept(accountId => resyncService.resync({ accountId, sinceDays: null }))
        ).pipe(Effect.provide(TestLayer))
    );
});

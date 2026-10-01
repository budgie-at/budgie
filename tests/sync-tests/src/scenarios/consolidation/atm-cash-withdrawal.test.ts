import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { CategorizeInboxService } from '@app/categorize-inbox/service/categorize-inbox.service';
import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { TransferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { TransactionService } from '@app/transaction/service/transaction.service';
import {
    AccountBalanceRepository,
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    StatisticsRepository,
    SyncRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionEntityTable
} from '@budgie/contracts';
import { describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildMonobank,
    expectAtmCashWithdrawalConsolidation,
    fetchCanonicalsOfType,
    fetchExpenseEntries,
    fetchTransactionById,
    findMccByCode,
    monobankStub,
    seed,
    seedBankPair,
    setupMonobankFixture,
    testDb,
    TestLayer
} from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type { TransactionEntryCreateEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

const PRECISION = 1_000_000;

const seedAtmExpense = (bankAccountId: number) =>
    Effect.gen(function* () {
        return yield* seedBankPair.expense(
            { externalId: 'tx-atm', operatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            { accountId: bankAccountId, amount: 500 * PRECISION, mccCategoryId: (yield* findMccByCode('6011')).id }
        );
    });

const seedAtmCashWithdrawalFixture = () =>
    Effect.gen(function* () {
        const bankAccount = yield* seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
        const expense = yield* seedAtmExpense(bankAccount.id);

        return { bankAccount, cashAccount, expense };
    });

const fetchGeneratedAtmFeeTransactions = (canonicalTransactionId: number) =>
    Effect.gen(function* () {
        return yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, `atm-fee:${canonicalTransactionId}`));
    });

const expectBankFeeEntry = (feeEntry: TransactionEntryEntityInterface, feeAmount: number) => {
    expect(feeEntry.amount).toBe(feeAmount * PRECISION);
    expect(feeEntry.categoryId).toBe(BANK_FEE_CATEGORY_ID);
};

const expectAccountBalances = Effect.fnUntraced(function* (
    bankAccountId: number,
    cashAccountId: number,
    expectedBankBalance: number,
    expectedCashBalance: number
) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const bankBalance = (yield* accountBalanceRepository.getByAccountId(bankAccountId)).at(0);
    const cashBalance = (yield* accountBalanceRepository.getByAccountId(cashAccountId)).at(0);

    expect(bankBalance?.balance).toBe(expectedBankBalance * PRECISION);
    expect(cashBalance?.balance).toBe(expectedCashBalance * PRECISION);
});

const stubAtmWithFeeStatement = (id: string): void => {
    monobankStub.statement([
        buildMonobank.transaction({
            id,
            amount: -40800,
            commissionRate: -800,
            hold: false,
            mcc: 6011,
            operationAmount: -40800
        })
    ]);
};

describe('consolidation/atm-cash-withdrawal', () => {
    it.effect('promotes an MCC=6011 expense into a TRANSFER to the unique cash account in the same currency', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount, expense } = yield* seedAtmCashWithdrawalFixture();

            yield* expectAtmCashWithdrawalConsolidation(bankAccount.id, cashAccount.id, expense.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps Monobank ATM commission as a fee entry after cash withdrawal consolidation', () =>
        Effect.gen(function* () {
            const categorizeInboxService = yield* CategorizeInboxService;
            const monobankSyncService = yield* MonobankSyncService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const transactionService = yield* TransactionService;
            const statisticsRepository = yield* StatisticsRepository;

            const { account: bankAccount } = yield* setupMonobankFixture();
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
            monobankStub.statement([
                buildMonobank.transaction({
                    id: 'tx-atm-with-fee',
                    amount: -40800,
                    commissionRate: -800,
                    hold: false,
                    mcc: 6011,
                    operationAmount: -40800
                })
            ]);

            yield* monobankSyncService.sync();
            const result = yield* transferConsolidationService.consolidate(null);
            const [atmExpense] = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalId, 'tx-atm-with-fee'));

            expect(result.consolidated).toBe(0);
            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
            expect(yield* categorizeInboxService.moveToCash([atmExpense.id])).toEqual([atmExpense.id]);

            const [canonical] = yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
            expect(canonical.fromAccountId).toBe(bankAccount.id);
            const canonicalEntries = yield* fetchExpenseEntries(canonical.id);
            const [canonicalBankEntry] = canonicalEntries.filter(
                entry => entry.type === TransactionEntryTypeEnum.CREDIT && entry.originalTransactionId === null
            );
            const [canonicalCashEntry] = canonicalEntries.filter(
                entry => entry.type === TransactionEntryTypeEnum.DEBIT && entry.originalTransactionId === null
            );
            const [feeEntry] = canonicalEntries.filter(entry => String(entry.type) === 'FEE');

            expect(canonicalBankEntry.amount).toBe(400 * PRECISION);
            expect(canonicalCashEntry.amount).toBe(400 * PRECISION);

            const feeTransactions = yield* fetchGeneratedAtmFeeTransactions(canonical.id);
            expect(feeTransactions).toHaveLength(0);
            expectBankFeeEntry(feeEntry, 8);

            const categoryRows = yield* statisticsRepository.getExpenseByCategoryQuery(
                DEFAULT_TRANSACTION_FILTER,
                bankAccount.instrumentId,
                LanguageEnum.EN
            );
            const feeCategoryAmount = categoryRows.find(row => row.category?.id === BANK_FEE_CATEGORY_ID)?.amount;
            yield* expectAccountBalances(bankAccount.id, cashAccount.id, -408, 400);
            expect(feeCategoryAmount).toBe(8 * PRECISION);

            const secondResult = yield* transferConsolidationService.consolidate(null);
            expect(secondResult.consolidated).toBe(0);

            const secondFeeTransactions = yield* fetchGeneratedAtmFeeTransactions(canonical.id);
            expect(secondFeeTransactions).toHaveLength(0);

            yield* transactionService.unconsolidateById(canonical.id);

            const leftoverFeeTransactions = yield* fetchGeneratedAtmFeeTransactions(canonical.id);
            expect(leftoverFeeTransactions).toHaveLength(0);

            const [sourceTransaction] = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalId, 'tx-atm-with-fee'));
            expect(sourceTransaction.consolidationParentTransactionId).toBeNull();

            const restoredSourceEntries = yield* fetchExpenseEntries(sourceTransaction.id);
            expect(restoredSourceEntries).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps previously synced Monobank ATM commission marked only by fee category source after consolidation', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount, expense } = yield* seedAtmCashWithdrawalFixture();

            yield* insertOne(TransactionEntryEntityTable, {
                transactionId: expense.id,
                accountId: bankAccount.id,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: 8 * PRECISION,
                externalId: 'tx-atm:fee',
                exchangeRate: 1,
                toIban: null,
                categoryId: BANK_FEE_CATEGORY_ID,
                categorySource: CategorySourceEnum.FEE,
                mccCategoryId: null,
                originalTransactionId: null
            } satisfies TransactionEntryCreateEntityInterface);

            yield* expectAtmCashWithdrawalConsolidation(bankAccount.id, cashAccount.id, expense.id);

            const [canonical] = yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);
            const canonicalEntries = yield* fetchExpenseEntries(canonical.id);
            const [feeEntry] = canonicalEntries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE);

            expectBankFeeEntry(feeEntry, 8);
            yield* expectAccountBalances(bankAccount.id, cashAccount.id, -508, 500);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not enqueue global consolidation after an empty stale Monobank sync', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            const syncRepository = yield* SyncRepository;

            const staleForwardSyncDate = new Date(2026, 0, 1);
            const { sync } = yield* setupMonobankFixture();
            yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
            stubAtmWithFeeStatement('tx-historical-atm-with-fee');

            yield* monobankSyncService.sync();
            vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();
            yield* syncRepository.update(sync.id, {
                forwardSyncedAt: staleForwardSyncDate,
                forwardSyncFromAt: staleForwardSyncDate
            });

            monobankStub.statement([]);
            yield* monobankSyncService.sync();

            expect(transferConsolidationDrainerService.enqueue).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not enqueue global consolidation when Monobank sync has no stale batch pending', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;

            yield* setupMonobankFixture();
            yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
            stubAtmWithFeeStatement('tx-fresh-atm-with-fee');

            yield* monobankSyncService.sync();
            vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();

            monobankStub.statement([]);
            yield* monobankSyncService.sync();

            expect(transferConsolidationDrainerService.enqueue).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('moves exactly the chosen ATM withdrawal to cash, keeps stored balances on the ledger and undoes the move', () =>
        Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const categorizeInboxService = yield* CategorizeInboxService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const accountBalanceRepository = yield* AccountBalanceRepository;

            const { bankAccount, cashAccount, expense } = yield* seedAtmCashWithdrawalFixture();
            const otherExpense = yield* seedBankPair.expense(
                { externalId: 'tx-atm-other', operatedAt: new Date() },
                { accountId: bankAccount.id, amount: 300 * PRECISION, mccCategoryId: (yield* findMccByCode('6011')).id }
            );
            const expectStoredBalancesOnLedger = Effect.fnUntraced(function* (expectedBankBalance: number, expectedCashBalance: number) {
                const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([bankAccount.id, cashAccount.id]);

                yield* expectAccountBalances(bankAccount.id, cashAccount.id, expectedBankBalance, expectedCashBalance);
                expect(ledgerBalances.get(bankAccount.id)).toBe(expectedBankBalance * PRECISION);
                expect(ledgerBalances.get(cashAccount.id) ?? 0).toBe(expectedCashBalance * PRECISION);
            });

            yield* transferConsolidationService.consolidate(null);
            yield* accountBalanceIncrementalService.updateAllBalances(true);
            yield* expectStoredBalancesOnLedger(-800, 0);

            expect(yield* categorizeInboxService.moveToCash([expense.id])).toEqual([expense.id]);
            yield* expectStoredBalancesOnLedger(-800, 500);
            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(1);
            expect((yield* fetchTransactionById(otherExpense.id)).consolidationParentTransactionId).toBeNull();

            expect(yield* categorizeInboxService.moveToCash([expense.id])).toEqual([]);
            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(1);
            yield* expectStoredBalancesOnLedger(-800, 500);

            yield* categorizeInboxService.undoMoveToCash([expense.id]);
            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
            expect((yield* fetchTransactionById(expense.id)).consolidationParentTransactionId).toBeNull();
            yield* expectStoredBalancesOnLedger(-800, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not move to cash when more than one cash account shares the currency', () =>
        Effect.gen(function* () {
            const categorizeInboxService = yield* CategorizeInboxService;
            const transferConsolidationService = yield* TransferConsolidationService;

            const bankAccount = yield* seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            yield* seed.account({ title: 'Cash 1', type: AccountTypeEnum.CASH, instrumentId: 1 });
            yield* seed.account({ title: 'Cash 2', type: AccountTypeEnum.CASH, instrumentId: 1 });
            const expense = yield* seedAtmExpense(bankAccount.id);

            expect(yield* transferConsolidationService.consolidate(null)).toMatchObject({ consolidated: 0 });
            expect(yield* categorizeInboxService.moveToCash([expense.id])).toEqual([]);
            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reverts an ATM cash withdrawal canonical and restores the source expense', () =>
        Effect.gen(function* () {
            const categorizeInboxService = yield* CategorizeInboxService;
            const transactionService = yield* TransactionService;

            const bankAccount = yield* seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
            const expense = yield* seedAtmExpense(bankAccount.id);

            yield* categorizeInboxService.moveToCash([expense.id]);

            const canonical = (yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL))[0];
            expect(canonical).toBeDefined();

            yield* transactionService.unconsolidateById(canonical.id);

            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(0);
            expect((yield* fetchTransactionById(expense.id)).consolidationParentTransactionId).toBeNull();

            const restoredEntries = yield* fetchExpenseEntries(expense.id);
            expect(restoredEntries).toHaveLength(1);
            expect(restoredEntries[0].originalTransactionId).toBeNull();

            const leftoverEntries = yield* fetchExpenseEntries(canonical.id);
            expect(leftoverEntries).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});

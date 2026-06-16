import { describe, expect, it } from 'vitest';

import { accountBalanceRepository, statisticsRepository, transactionRepository } from '@app/@generic/drizzle/db/db';
import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { buildDebtAccountProgressSummary } from '@app/account/utils/build-debt-account-progress-summary.util';
import { transactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    CategoryEntityTable,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { isDefined } from '@rnw-community/shared';

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

describe('debt settlement statistics', () => {
    it('counts debt returns once in income analytics while updating the lent debt balance', () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance: 300 * PRECISION });

        createDebtFundingTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION);
        createDebtReturnIncome(cashAccount.id, debtAccount.id, category.id, 100 * PRECISION);

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId).get();
        const categoryRows = statisticsRepository
            .getIncomeByCategoryQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId, LanguageEnum.EN)
            .all();
        const categoryAmount = categoryRows.find(row => row.category?.id === category.id)?.amount;
        const cashBalance = accountBalanceRepository.getByAccountId(cashAccount.id).get();
        const debtBalance = accountBalanceRepository.getByAccountId(debtAccount.id).get();
        const remainingLentDebt = accountBalanceRepository
            .getTotalRemainingDebtByType(cashAccount.instrumentId, AccountDebtTypeEnum.LENT)
            .get();
        const debtAccountTransactionCount = transactionRepository
            .countAll({ ...DEFAULT_TRANSACTION_FILTER, accountIds: [debtAccount.id] })
            .get();

        expect(totals?.income).toBe(100 * PRECISION);
        expect(totals?.expense).toBe(300 * PRECISION);
        expect(categoryAmount).toBe(100 * PRECISION);
        expect(cashBalance?.balance).toBe(-200 * PRECISION);
        expect(debtBalance?.balance).toBe(200 * PRECISION);
        expect(remainingLentDebt?.total).toBe(200 * PRECISION);
        expect(debtAccountTransactionCount?.value).toBe(2);
    });

    it('attaches an income transaction to a lent debt and closes the lent balance', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance: 300 * PRECISION });

        createDebtFundingTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION);
        const transaction = createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const cashBalance = accountBalanceRepository.getByAccountId(cashAccount.id).get();
        const debtBalance = accountBalanceRepository.getByAccountId(debtAccount.id).get();
        const settlementEntry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .all()
            .find(entry => entry.transactionId === transaction.id && entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);

        expect(cashBalance?.balance).toBe(-200 * PRECISION);
        expect(debtBalance?.balance).toBe(200 * PRECISION);
        expect(settlementEntry?.type).toBe(TransactionEntryTypeEnum.CREDIT);
        expect(settlementEntry?.amount).toBe(100 * PRECISION);
    });

    it('attaches an expense transaction to a lent debt and increases the lent balance', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance: 500 * PRECISION });

        createDebtFundingTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION);
        const transaction = createExpenseTransaction(cashAccount.id, category.id, 100 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const cashBalance = accountBalanceRepository.getByAccountId(cashAccount.id).get();
        const debtBalance = accountBalanceRepository.getByAccountId(debtAccount.id).get();
        const settlementEntry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .all()
            .find(entry => entry.transactionId === transaction.id && entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);

        expect(cashBalance?.balance).toBe(-400 * PRECISION);
        expect(debtBalance?.balance).toBe(400 * PRECISION);
        expect(settlementEntry?.type).toBe(TransactionEntryTypeEnum.DEBIT);
        expect(settlementEntry?.amount).toBe(100 * PRECISION);
    });

    it('summarizes lent debt progress from debit openings and credit returns', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 7_900 * PRECISION,
            debitAmount: 10_000 * PRECISION,
            creditAmount: 2_100 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expect(summary.outstandingAmount).toBe(7_900 * PRECISION);
        expect(summary.paidAmount).toBe(2_100 * PRECISION);
        expect(summary.totalAmount).toBe(10_000 * PRECISION);
        expect(summary.percentage).toBe(21);
    });

    it('summarizes lent debt progress from an existing balance and later debit openings', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 8_000 * PRECISION,
            debitAmount: 100 * PRECISION,
            creditAmount: 2_100 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expect(summary.outstandingAmount).toBe(8_000 * PRECISION);
        expect(summary.paidAmount).toBe(2_100 * PRECISION);
        expect(summary.totalAmount).toBe(10_100 * PRECISION);
        expect(summary.percentage).toBe(20.79);
    });

    it('summarizes a lent debt target as outstanding before any ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 0,
            debitAmount: 0,
            creditAmount: 0,
            targetAmount: 13_000 * PRECISION
        });

        expect(summary.outstandingAmount).toBe(13_000 * PRECISION);
        expect(summary.paidAmount).toBe(0);
        expect(summary.totalAmount).toBe(13_000 * PRECISION);
        expect(summary.percentage).toBe(0);
    });

    it('summarizes target-only debt from home account rows before any ledger entries exist', () => {
        const debtAccount = seed.account({
            title: 'Target only debt',
            type: AccountTypeEnum.DEBT,
            targetBalance: 13_000 * PRECISION
        });
        const row = accountBalanceRepository
            .getHomeAccountRows(debtAccount.instrumentId)
            .all()
            .find(homeRow => homeRow.account.id === debtAccount.id);

        expect(row).toBeDefined();

        if (!isDefined(row)) {
            return;
        }

        const summary = buildDebtAccountProgressSummary({
            debtType: row.account.debtType,
            balance: convertFromMicroUnits(row.convertedBalance),
            debitAmount: convertFromMicroUnits(row.convertedDebitAmount),
            creditAmount: convertFromMicroUnits(row.convertedCreditAmount),
            targetAmount: convertFromMicroUnits(row.convertedTargetBalance)
        });

        expect(summary.outstandingAmount).toBe(13_000);
        expect(summary.paidAmount).toBe(0);
        expect(summary.totalAmount).toBe(13_000);
        expect(summary.percentage).toBe(0);
    });

    it('summarizes borrowed debt progress from credit openings and debit repayments', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: -7_900 * PRECISION,
            debitAmount: 2_100 * PRECISION,
            creditAmount: 10_000 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expect(summary.outstandingAmount).toBe(7_900 * PRECISION);
        expect(summary.paidAmount).toBe(2_100 * PRECISION);
        expect(summary.totalAmount).toBe(10_000 * PRECISION);
        expect(summary.percentage).toBe(21);
    });

    it('summarizes borrowed debt progress from an existing balance and later credit openings', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: -36_000 * PRECISION,
            debitAmount: 10_000 * PRECISION,
            creditAmount: 1_000 * PRECISION,
            targetAmount: 45_000 * PRECISION
        });

        expect(summary.outstandingAmount).toBe(36_000 * PRECISION);
        expect(summary.paidAmount).toBe(10_000 * PRECISION);
        expect(summary.totalAmount).toBe(46_000 * PRECISION);
        expect(summary.percentage).toBe(21.74);
    });

    it('summarizes a borrowed debt target as outstanding before any ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: 0,
            debitAmount: 0,
            creditAmount: 0,
            targetAmount: 45_000 * PRECISION
        });

        expect(summary.outstandingAmount).toBe(45_000 * PRECISION);
        expect(summary.paidAmount).toBe(0);
        expect(summary.totalAmount).toBe(45_000 * PRECISION);
        expect(summary.percentage).toBe(0);
    });

    it('counts debt repayments once in expense analytics while updating the borrowed debt balance', () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({
            title: 'I owe Alex',
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.BORROW,
            targetBalance: 300 * PRECISION
        });

        createDebtBorrowingTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION);
        createDebtRepaymentExpense(cashAccount.id, debtAccount.id, category.id, 100 * PRECISION);

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId).get();
        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId, LanguageEnum.EN)
            .all();
        const categoryAmount = categoryRows.find(row => row.category?.id === category.id)?.amount;
        const cashBalance = accountBalanceRepository.getByAccountId(cashAccount.id).get();
        const debtBalance = accountBalanceRepository.getByAccountId(debtAccount.id).get();
        const remainingBorrowedDebt = accountBalanceRepository
            .getTotalRemainingDebtByType(cashAccount.instrumentId, AccountDebtTypeEnum.BORROW)
            .get();
        const debtAccountTransactionCount = transactionRepository
            .countAll({ ...DEFAULT_TRANSACTION_FILTER, accountIds: [debtAccount.id] })
            .get();

        expect(totals?.income).toBe(0);
        expect(totals?.expense).toBe(100 * PRECISION);
        expect(categoryAmount).toBe(100 * PRECISION);
        expect(cashBalance?.balance).toBe(200 * PRECISION);
        expect(debtBalance?.balance).toBe(-200 * PRECISION);
        expect(remainingBorrowedDebt?.total).toBe(200 * PRECISION);
        expect(debtAccountTransactionCount?.value).toBe(2);
    });
});

const createDebtFundingTransaction = (cashAccountId: number, debtAccountId: number, amount: number): void => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.DEBT,
        title: 'Lend money to Alex',
        externalId: null,
        externalSource: null,
        operatedAt: new Date('2026-06-01T12:00:00.000Z'),
        comment: '',
        fromAccountId: cashAccountId,
        toAccountId: debtAccountId,
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });
};

const createDebtReturnIncome = (cashAccountId: number, debtAccountId: number, categoryId: number, amount: number): void => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.INCOME,
        title: 'Alex returned money',
        externalId: null,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        comment: '',
        fromAccountId: null,
        toAccountId: cashAccountId,
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
        amount,
        categoryId
    });
};

const createDebtBorrowingTransaction = (cashAccountId: number, debtAccountId: number, amount: number): void => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.DEBT,
        title: 'Borrow money from Alex',
        externalId: null,
        externalSource: null,
        operatedAt: new Date('2026-06-01T12:00:00.000Z'),
        comment: '',
        fromAccountId: debtAccountId,
        toAccountId: cashAccountId,
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });
};

const createDebtRepaymentExpense = (cashAccountId: number, debtAccountId: number, categoryId: number, amount: number): void => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Return money to Alex',
        externalId: null,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        comment: '',
        fromAccountId: cashAccountId,
        toAccountId: null,
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: debtAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.DEBT_SETTLEMENT,
        amount,
        categoryId
    });
};

const createIncomeTransaction = (cashAccountId: number, categoryId: number, amount: number) => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.INCOME,
        title: 'Alex returned money',
        externalId: null,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        comment: '',
        fromAccountId: null,
        toAccountId: cashAccountId,
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId
    });

    return transaction;
};

const createExpenseTransaction = (cashAccountId: number, categoryId: number, amount: number) => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Lend more money to Alex',
        externalId: null,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        comment: '',
        fromAccountId: cashAccountId,
        toAccountId: null,
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId
    });

    return transaction;
};

const createTransactionEntry = (
    entry: Pick<TransactionEntryCreateEntityInterface, 'transactionId' | 'accountId' | 'type' | 'kind' | 'amount' | 'categoryId'>
): void => {
    insertOne(TransactionEntryEntityTable, {
        ...entry,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: entry.amount,
        toIban: null
    } satisfies TransactionEntryCreateEntityInterface);
};

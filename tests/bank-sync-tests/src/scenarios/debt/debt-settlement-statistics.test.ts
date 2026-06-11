import { describe, expect, it } from 'vitest';

import { accountBalanceRepository, statisticsRepository, transactionRepository } from '@app/@generic/drizzle/db/db';
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

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

describe('debt settlement statistics', () => {
    it('counts debt returns once in income analytics while updating the lent debt balance', () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT });

        createDebtFundingTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION);
        createDebtReturnIncome(cashAccount.id, debtAccount.id, category.id, 100 * PRECISION);

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId).get();
        const categoryRows = statisticsRepository
            .getIncomeByCategoryQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId, LanguageEnum.EN)
            .all();
        const categoryAmount = categoryRows.find(row => row.category?.id === category.id)?.amount;
        const cashBalance = accountBalanceRepository.getByAccountId(cashAccount.id).get();
        const debtBalance = accountBalanceRepository.getByAccountId(debtAccount.id).get();
        const debtAccountTransactionCount = transactionRepository
            .countAll({ ...DEFAULT_TRANSACTION_FILTER, accountIds: [debtAccount.id] })
            .get();

        expect(totals?.income).toBe(100 * PRECISION);
        expect(totals?.expense).toBe(300 * PRECISION);
        expect(categoryAmount).toBe(100 * PRECISION);
        expect(cashBalance?.balance).toBe(-200 * PRECISION);
        expect(debtBalance?.balance).toBe(200 * PRECISION);
        expect(debtAccountTransactionCount?.value).toBe(2);
    });

    it('counts debt repayments once in expense analytics while updating the borrowed debt balance', () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = seed.account({ title: 'I owe Alex', type: AccountTypeEnum.DEBT, debtType: AccountDebtTypeEnum.BORROW });

        createDebtBorrowingTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION);
        createDebtRepaymentExpense(cashAccount.id, debtAccount.id, category.id, 100 * PRECISION);

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId).get();
        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId, LanguageEnum.EN)
            .all();
        const categoryAmount = categoryRows.find(row => row.category?.id === category.id)?.amount;
        const cashBalance = accountBalanceRepository.getByAccountId(cashAccount.id).get();
        const debtBalance = accountBalanceRepository.getByAccountId(debtAccount.id).get();
        const debtAccountTransactionCount = transactionRepository
            .countAll({ ...DEFAULT_TRANSACTION_FILTER, accountIds: [debtAccount.id] })
            .get();

        expect(totals?.income).toBe(0);
        expect(totals?.expense).toBe(100 * PRECISION);
        expect(categoryAmount).toBe(100 * PRECISION);
        expect(cashBalance?.balance).toBe(200 * PRECISION);
        expect(debtBalance?.balance).toBe(-200 * PRECISION);
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

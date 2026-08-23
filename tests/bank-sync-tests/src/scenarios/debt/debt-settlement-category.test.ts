import { statisticsRepository } from '@app/@generic/drizzle/db/db';
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
    TransactionTypeEnum,
    DEBT_PAYMENT_CATEGORY_ID
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type {
    CategoryEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

const SETTLED_AMOUNT = 100 * PRECISION;

const fetchDebtPaymentCategory = (): CategoryEntityInterface | undefined =>
    testDb
        .select()
        .from(CategoryEntityTable)
        .all()
        .find(row => row.id === DEBT_PAYMENT_CATEGORY_ID);

const fetchPrimaryEntry = (transactionId: number): TransactionEntryEntityInterface => {
    const entry = testDb
        .select()
        .from(TransactionEntryEntityTable)
        .all()
        .find(row => row.transactionId === transactionId && row.kind === TransactionEntryKindEnum.PRIMARY);

    if (!isDefined(entry)) {
        throw new Error(`Primary entry for transaction ${transactionId} not found`);
    }

    return entry;
};

const createCashAccount = () => seed.account({ title: 'Category cash account', type: AccountTypeEnum.BANK_SYNC });

const createDebtAccount = () =>
    seed.account({
        title: 'Category debt account',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.LENT,
        targetBalance: 300 * PRECISION
    });

const createSettlementTransaction = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    cashAccountId: number,
    categoryId: number | null
) => {
    const isExpense = type === TransactionTypeEnum.EXPENSE;
    const transaction = insertOne(TransactionEntityTable, {
        type,
        title: isExpense ? 'Grocery store' : 'Alex returned money',
        externalId: null,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        comment: '',
        exchangeRate: 1,
        updatedBy: null,
        fromAccountId: isExpense ? cashAccountId : null,
        toAccountId: isExpense ? null : cashAccountId
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount: SETTLED_AMOUNT,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: SETTLED_AMOUNT,
        toIban: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const createUserCategorizedExpenseFixture = async () => {
    const [userCategory] = testDb.select().from(CategoryEntityTable).all();
    const cashAccount = createCashAccount();
    const debtAccount = createDebtAccount();
    const transaction = createSettlementTransaction(TransactionTypeEnum.EXPENSE, cashAccount.id, userCategory.id);

    return { debtAccount, transaction, userCategory };
};

const attachAndReadEntry = async (transactionId: number, debtAccountId: number): Promise<TransactionEntryEntityInterface> => {
    await transactionDebtSettlementService.attach({ transactionId, debtAccountId });

    return fetchPrimaryEntry(transactionId);
};

const expectUserCategoryPreserved = (entry: TransactionEntryEntityInterface, userCategoryId: number): void => {
    expect(entry.categoryId).toBe(userCategoryId);
    expect(entry.categorySource).toBe('USER');
};

const attachDetachAndReadEntry = async (transactionId: number, debtAccountId: number): Promise<TransactionEntryEntityInterface> => {
    await transactionDebtSettlementService.attach({ transactionId, debtAccountId });
    await transactionDebtSettlementService.detach(transactionId);

    return fetchPrimaryEntry(transactionId);
};

const readExpenseExpenseTotal = (instrumentId: number): number => {
    const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, instrumentId).get();

    return totals?.expense ?? -1;
};

const fetchNullCategoryExpenseRows = (instrumentId: number) =>
    statisticsRepository
        .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, LanguageEnum.EN)
        .all()
        .filter(row => !isDefined(row.category));

describe('debt settlement categorization', () => {
    it('seeds the default Debt Payments category under the stable id 17', () => {
        const category = fetchDebtPaymentCategory();

        expect(category?.title).toBe('Debt Payments');
        expect(category?.isDefault).toBe(true);
        expect(category?.isSystemCategory).toBe(false);
    });

    it('assigns the Debt Payments category when attaching an uncategorized expense', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount();
        const transaction = createSettlementTransaction(TransactionTypeEnum.EXPENSE, cashAccount.id, null);

        const entry = await attachAndReadEntry(transaction.id, debtAccount.id);

        expect(entry.categoryId).toBe(DEBT_PAYMENT_CATEGORY_ID);
        expect(entry.categorySource).toBe('DEBT_SETTLEMENT');
    });

    it('moves the attached expense out of Uncategorized without changing the expense total', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount();
        const transaction = createSettlementTransaction(TransactionTypeEnum.EXPENSE, cashAccount.id, null);
        const expenseBefore = readExpenseExpenseTotal(cashAccount.instrumentId);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const expenseAfter = readExpenseExpenseTotal(cashAccount.instrumentId);
        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId, LanguageEnum.EN)
            .all();
        const debtPaymentRow = categoryRows.find(row => row.category?.id === DEBT_PAYMENT_CATEGORY_ID);

        expect(expenseAfter).toBe(expenseBefore);
        expect(expenseAfter).toBe(SETTLED_AMOUNT);
        expect(debtPaymentRow?.amount).toBe(SETTLED_AMOUNT);
        expect(fetchNullCategoryExpenseRows(cashAccount.instrumentId)).toHaveLength(0);
    });

    it('never clobbers an existing category when attaching', async () => {
        const { debtAccount, transaction, userCategory } = await createUserCategorizedExpenseFixture();

        const entry = await attachAndReadEntry(transaction.id, debtAccount.id);

        expectUserCategoryPreserved(entry, userCategory.id);
    });

    it('leaves attached incomes uncategorized', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount();
        const transaction = createSettlementTransaction(TransactionTypeEnum.INCOME, cashAccount.id, null);

        const entry = await attachAndReadEntry(transaction.id, debtAccount.id);

        expect(entry.categoryId).toBeNull();
    });

    it('reverts only the settlement-sourced category on detach', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount();
        const transaction = createSettlementTransaction(TransactionTypeEnum.EXPENSE, cashAccount.id, null);

        const entry = await attachDetachAndReadEntry(transaction.id, debtAccount.id);

        expect(entry.categoryId).toBeNull();
        expect(entry.categorySource).toBe('USER');
    });

    it('keeps a user category on detach of a categorized expense attachment', async () => {
        const { debtAccount, transaction, userCategory } = await createUserCategorizedExpenseFixture();

        const entry = await attachDetachAndReadEntry(transaction.id, debtAccount.id);

        expectUserCategoryPreserved(entry, userCategory.id);
    });
});

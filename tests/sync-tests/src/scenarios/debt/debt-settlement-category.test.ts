import { accountBalanceRepository, statisticsRepository } from '@app/@generic/drizzle/db/db';
import { transactionDebtSettlementService } from '@app/transaction/service/transaction-debt-settlement.service';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BORROWING_CATEGORY_ID,
    CategoryEntityTable,
    CategorySourceEnum,
    DEFAULT_TRANSACTION_FILTER,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    LENDING_CATEGORY_ID,
    LanguageEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type {
    AccountEntityInterface,
    DebtEventEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

const OPENED_AMOUNT = 300 * PRECISION;
const SETTLED_AMOUNT = 100 * PRECISION;
const OVERPAID_AMOUNT = 400 * PRECISION;
const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');

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

const fetchDebtEvents = (debtAccountId: number): DebtEventEntityInterface[] =>
    testDb.select().from(DebtEventEntityTable).where(eq(DebtEventEntityTable.debtAccountId, debtAccountId)).all();

const fetchAccountEntries = (accountId: number): TransactionEntryEntityInterface[] =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId)).all();

const fetchLedgerBalance = (accountId: number): number | undefined => accountBalanceRepository.getByAccountId(accountId).get()?.balance;

const fetchDebtProgress = (accountId: number) => {
    const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(accountId).get();

    if (!isDefined(progress)) {
        throw new Error(`Debt progress for account ${accountId} not found`);
    }

    return progress;
};

const createCashAccount = () => seed.account({ title: 'Category cash account', type: AccountTypeEnum.BANK_SYNC });

const createDebtAccount = (debtType: AccountDebtTypeEnum): AccountEntityInterface => {
    const account = seed.account({ title: 'Category debt account', type: AccountTypeEnum.DEBT, debtType, targetBalance: OPENED_AMOUNT });

    insertOne(DebtEventEntityTable, {
        debtAccountId: account.id,
        direction: DebtEventDirectionEnum.OPEN,
        source: DebtEventSourceEnum.OPENING,
        amount: OPENED_AMOUNT,
        operatedAt: OPERATED_AT
    });

    return account;
};

const createSettlementTransaction = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    cashAccountId: number,
    categoryId: number | null,
    amount = SETTLED_AMOUNT
) => {
    const isExpense = type === TransactionTypeEnum.EXPENSE;
    const transaction = insertOne(TransactionEntityTable, {
        type,
        title: isExpense ? 'Grocery store' : 'Alex returned money',
        externalId: null,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: OPERATED_AT,
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
        amount,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: amount,
        toIban: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const createUserCategorizedIncomeFixture = () => {
    const userCategory = testDb
        .select()
        .from(CategoryEntityTable)
        .all()
        .find(row => row.id !== LENDING_CATEGORY_ID && row.id !== BORROWING_CATEGORY_ID);

    if (!isDefined(userCategory)) {
        throw new Error('No non-debt category seeded');
    }

    const cashAccount = createCashAccount();
    const debtAccount = createDebtAccount(AccountDebtTypeEnum.LENT);
    const transaction = createSettlementTransaction(TransactionTypeEnum.INCOME, cashAccount.id, userCategory.id);

    return { debtAccount, transaction, userCategory };
};

const attachAndReadEntry = async (transactionId: number, debtAccountId: number): Promise<TransactionEntryEntityInterface> => {
    await transactionDebtSettlementService.attach({ transactionId, debtAccountId });

    return fetchPrimaryEntry(transactionId);
};

const expectUserCategoryPreserved = (entry: TransactionEntryEntityInterface, userCategoryId: number): void => {
    expect(entry.categoryId).toBe(userCategoryId);
    expect(entry.categorySource).toBe(CategorySourceEnum.USER);
};

const attachDetachAndReadEntry = async (transactionId: number, debtAccountId: number): Promise<TransactionEntryEntityInterface> => {
    await transactionDebtSettlementService.attach({ transactionId, debtAccountId });
    await transactionDebtSettlementService.detach(transactionId);

    return fetchPrimaryEntry(transactionId);
};

const readExpenseTotal = (instrumentId: number): number => {
    const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, instrumentId).get();

    return totals?.expense ?? -1;
};

const fetchNullCategoryExpenseRows = (instrumentId: number) =>
    statisticsRepository
        .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, LanguageEnum.EN)
        .all()
        .filter(row => !isDefined(row.category));

describe('debt settlement categorization', () => {
    it.each<[AccountDebtTypeEnum, TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME, number, number]>([
        [AccountDebtTypeEnum.LENT, TransactionTypeEnum.INCOME, LENDING_CATEGORY_ID, OPENED_AMOUNT - SETTLED_AMOUNT],
        [AccountDebtTypeEnum.BORROW, TransactionTypeEnum.EXPENSE, BORROWING_CATEGORY_ID, SETTLED_AMOUNT - OPENED_AMOUNT]
    ])('categorizes and repays a %s debt when attaching an uncategorized %s', async (debtType, type, categoryId, expectedBalance) => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount(debtType);
        const transaction = createSettlementTransaction(type, cashAccount.id, null);

        const entry = await attachAndReadEntry(transaction.id, debtAccount.id);
        const progress = fetchDebtProgress(debtAccount.id);

        expect(entry.categoryId).toBe(categoryId);
        expect(entry.categorySource).toBe(CategorySourceEnum.DEBT_SETTLEMENT);
        expect(fetchDebtEvents(debtAccount.id).at(1)?.direction).toBe(DebtEventDirectionEnum.CLOSE);
        expect(progress.paidAmount).toBe(SETTLED_AMOUNT);
        expect(progress.totalAmount).toBe(OPENED_AMOUNT);
        expect(fetchLedgerBalance(debtAccount.id)).toBe(expectedBalance);
    });

    it('assigns Lending and grows the debt when attaching an uncategorized expense to a lent debt', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount(AccountDebtTypeEnum.LENT);
        const transaction = createSettlementTransaction(TransactionTypeEnum.EXPENSE, cashAccount.id, null);

        const entry = await attachAndReadEntry(transaction.id, debtAccount.id);
        const progress = fetchDebtProgress(debtAccount.id);

        expect(entry.categoryId).toBe(LENDING_CATEGORY_ID);
        expect(fetchDebtEvents(debtAccount.id).at(1)?.direction).toBe(DebtEventDirectionEnum.OPEN);
        expect(progress.totalAmount).toBe(OPENED_AMOUNT + SETTLED_AMOUNT);
        expect(fetchLedgerBalance(debtAccount.id)).toBe(OPENED_AMOUNT + SETTLED_AMOUNT);
    });

    it('creates no entry on the debt account when attaching', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount(AccountDebtTypeEnum.LENT);
        const transaction = createSettlementTransaction(TransactionTypeEnum.INCOME, cashAccount.id, null);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const settlementEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .all()
            .filter(entry => entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);

        expect(fetchAccountEntries(debtAccount.id)).toHaveLength(0);
        expect(settlementEntries).toHaveLength(0);
    });

    it('moves the attached expense out of Uncategorized without changing the expense total', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount(AccountDebtTypeEnum.BORROW);
        const transaction = createSettlementTransaction(TransactionTypeEnum.EXPENSE, cashAccount.id, null);
        const expenseBefore = readExpenseTotal(cashAccount.instrumentId);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, cashAccount.instrumentId, LanguageEnum.EN)
            .all();

        expect(readExpenseTotal(cashAccount.instrumentId)).toBe(expenseBefore);
        expect(categoryRows.find(row => row.category?.id === BORROWING_CATEGORY_ID)?.amount).toBe(SETTLED_AMOUNT);
        expect(fetchNullCategoryExpenseRows(cashAccount.instrumentId)).toHaveLength(0);
    });

    it('never clobbers an existing category when attaching', async () => {
        const { debtAccount, transaction, userCategory } = createUserCategorizedIncomeFixture();

        const entry = await attachAndReadEntry(transaction.id, debtAccount.id);

        expectUserCategoryPreserved(entry, userCategory.id);
        expect(fetchDebtEvents(debtAccount.id)).toHaveLength(2);
    });

    it('reverts only the settlement-sourced category on detach', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount(AccountDebtTypeEnum.LENT);
        const transaction = createSettlementTransaction(TransactionTypeEnum.INCOME, cashAccount.id, null);

        const entry = await attachDetachAndReadEntry(transaction.id, debtAccount.id);

        expect(entry.categoryId).toBeNull();
        expect(entry.categorySource).toBe(CategorySourceEnum.USER);
        expect(fetchLedgerBalance(debtAccount.id)).toBe(OPENED_AMOUNT);
    });

    it('keeps a user category on detach of a categorized income attachment', async () => {
        const { debtAccount, transaction, userCategory } = createUserCategorizedIncomeFixture();

        const entry = await attachDetachAndReadEntry(transaction.id, debtAccount.id);

        expectUserCategoryPreserved(entry, userCategory.id);
    });

    it('caps an overpaying attachment at a zero ledger balance', async () => {
        const cashAccount = createCashAccount();
        const debtAccount = createDebtAccount(AccountDebtTypeEnum.LENT);
        const transaction = createSettlementTransaction(TransactionTypeEnum.INCOME, cashAccount.id, null, OVERPAID_AMOUNT);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const progress = fetchDebtProgress(debtAccount.id);

        expect(progress.outstandingAmount).toBe(0);
        expect(progress.overpaidAmount).toBe(OVERPAID_AMOUNT - OPENED_AMOUNT);
        expect(progress.percentage).toBe(100);
        expect(fetchLedgerBalance(debtAccount.id)).toBe(0);
    });
});

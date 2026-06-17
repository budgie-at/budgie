import { describe, expect, it } from 'vitest';

import { accountBalanceRepository, statisticsRepository, transactionRepository } from '@app/@generic/drizzle/db/db';
import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { accountService } from '@app/account/service/account.service';
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
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { isDefined } from '@rnw-community/shared';

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { AccountEntityInterface, TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

describe('debt settlement statistics', () => {
    it('counts debt returns once in income analytics while updating the lent debt balance', () => {
        const { category, cashAccount, debtAccount } = createFundedLentDebtFixture(300 * PRECISION);

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
        const { category, cashAccount, debtAccount } = createFundedLentDebtFixture(300 * PRECISION);

        const transaction = createIncomeTransaction(cashAccount.id, category.id, 100 * PRECISION);

        const { cashBalance, debtBalance, settlementEntry } = await attachDebtSettlementAndReadState(
            transaction.id,
            cashAccount.id,
            debtAccount.id
        );

        expect(cashBalance?.balance).toBe(-200 * PRECISION);
        expect(debtBalance?.balance).toBe(200 * PRECISION);
        expect(settlementEntry?.type).toBe(TransactionEntryTypeEnum.CREDIT);
        expect(settlementEntry?.amount).toBe(100 * PRECISION);
    });

    it('attaches an expense transaction to a lent debt and increases the lent balance', async () => {
        const { category, cashAccount, debtAccount } = createFundedLentDebtFixture(500 * PRECISION);

        const transaction = createExpenseTransaction(cashAccount.id, category.id, 100 * PRECISION);

        const { cashBalance, debtBalance, settlementEntry } = await attachDebtSettlementAndReadState(
            transaction.id,
            cashAccount.id,
            debtAccount.id
        );

        expect(cashBalance?.balance).toBe(-400 * PRECISION);
        expect(debtBalance?.balance).toBe(400 * PRECISION);
        expect(settlementEntry?.type).toBe(TransactionEntryTypeEnum.DEBIT);
        expect(settlementEntry?.amount).toBe(100 * PRECISION);
    });

    it('creates lent debt accounts by treating current balance as an already returned amount', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, 1);
        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(13_000 * PRECISION);
    });

    it('updates lent debt accounts by treating current balance as an already returned amount', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 0, 15_000, 1);

        await accountService.updateDebtById(account.id, {
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 2_000,
            targetBalance: 15_000
        });

        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(13_000 * PRECISION);
    });

    it('summarizes lent debt returns from the returned amount input and attached income', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await createDebtAccount(AccountDebtTypeEnum.LENT, 2_000, 15_000, cashAccount.instrumentId);
        const transaction = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.LENT);

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });

    it('summarizes lent debt progress against the original target amount', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 7_900 * PRECISION,
            debitAmount: 10_000 * PRECISION,
            creditAmount: 2_100 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 7_900 * PRECISION, 7_100 * PRECISION, 15_000 * PRECISION, 47.33);
    });

    it('keeps the lent target amount as the denominator when existing balance predates ledger entries', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 8_000 * PRECISION,
            debitAmount: 100 * PRECISION,
            creditAmount: 2_100 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 8_000 * PRECISION, 7_000 * PRECISION, 15_000 * PRECISION, 46.67);
    });

    it('summarizes a lent debt target as outstanding before any ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 0,
            debitAmount: 0,
            creditAmount: 0,
            targetAmount: 13_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 13_000 * PRECISION, 0, 13_000 * PRECISION, 0);
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

        expectDebtProgressSummary(summary, 13_000, 0, 13_000, 0);
    });

    it('summarizes borrowed debt progress against the original target amount', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: -7_900 * PRECISION,
            debitAmount: 2_100 * PRECISION,
            creditAmount: 10_000 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 7_900 * PRECISION, 7_100 * PRECISION, 15_000 * PRECISION, 47.33);
    });

    it('keeps the borrowed target amount as the denominator when existing balance predates ledger entries', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: -8_066 * PRECISION,
            debitAmount: 8_066 * PRECISION,
            creditAmount: 0,
            targetAmount: 45_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 8_066 * PRECISION, 36_934 * PRECISION, 45_000 * PRECISION, 82.08);
    });

    it('summarizes a borrowed debt target as outstanding before any ledger entries exist', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: 0,
            debitAmount: 0,
            creditAmount: 0,
            targetAmount: 45_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 45_000 * PRECISION, 0, 45_000 * PRECISION, 0);
    });

    it('creates borrowed debt accounts with a negative outstanding balance', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.BORROW, 8_066, 45_000, 1);
        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(-8_066 * PRECISION);
    });

    it('updates borrowed debt accounts with a negative outstanding balance', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.BORROW, 8_066, 45_000, 1);

        await accountService.updateDebtById(account.id, {
            debtType: AccountDebtTypeEnum.BORROW,
            currentBalance: 1_900,
            targetBalance: 15_000
        });

        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(-1_900 * PRECISION);
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

        createDebtTransferTransaction(debtAccount.id, cashAccount.id, 300 * PRECISION, 'Borrow money from Alex');
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

const createDebtAccount = (debtType: AccountDebtTypeEnum, currentBalance: number, targetBalance: number, instrumentId: number) =>
    accountService.createDebt({
        title: debtType === AccountDebtTypeEnum.LENT ? 'Nikita owes me' : 'Borrowed account',
        iban: null,
        icon: UserIconNameEnum.HandCoins,
        instrumentId,
        type: AccountTypeEnum.DEBT,
        debtType,
        currentBalance,
        targetBalance,
        contactId: null,
        deadline: null
    });

const createFundedLentDebtFixture = (targetBalance: number) => {
    const [category] = testDb.select().from(CategoryEntityTable).all();
    const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = seed.account({ title: 'Alex owes me', type: AccountTypeEnum.DEBT, targetBalance });

    createDebtTransferTransaction(cashAccount.id, debtAccount.id, 300 * PRECISION, 'Lend money to Alex');

    return { category, cashAccount, debtAccount };
};

const attachDebtSettlementAndReadState = async (transactionId: number, cashAccountId: number, debtAccountId: number) => {
    await transactionDebtSettlementService.attach({ transactionId, debtAccountId });

    const cashBalance = accountBalanceRepository.getByAccountId(cashAccountId).get();
    const debtBalance = accountBalanceRepository.getByAccountId(debtAccountId).get();
    const settlementEntry = testDb
        .select()
        .from(TransactionEntryEntityTable)
        .all()
        .find(entry => entry.transactionId === transactionId && entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);

    return { cashBalance, debtBalance, settlementEntry };
};

const buildSummaryFromDebtAccount = (debtAccount: Pick<AccountEntityInterface, 'id' | 'targetBalance'>, debtType: AccountDebtTypeEnum) => {
    const balance = accountBalanceRepository.getByAccountId(debtAccount.id).get();
    const debitAmount = getDebtEntryAmount(debtAccount.id, TransactionEntryTypeEnum.DEBIT);
    const creditAmount = getDebtEntryAmount(debtAccount.id, TransactionEntryTypeEnum.CREDIT);

    return buildDebtAccountProgressSummary({
        debtType,
        balance: balance?.balance ?? 0,
        debitAmount,
        creditAmount,
        targetAmount: debtAccount.targetBalance
    });
};

const getDebtEntryAmount = (debtAccountId: number, type: TransactionEntryTypeEnum): number =>
    testDb
        .select()
        .from(TransactionEntryEntityTable)
        .all()
        .filter(entry => entry.accountId === debtAccountId && entry.type === type)
        .reduce((total, entry) => total + entry.amount, 0);

const expectDebtProgressSummary = (
    summary: ReturnType<typeof buildDebtAccountProgressSummary>,
    outstandingAmount: number,
    paidAmount: number,
    totalAmount: number,
    percentage: number
): void => {
    expect(summary.outstandingAmount).toBe(outstandingAmount);
    expect(summary.paidAmount).toBe(paidAmount);
    expect(summary.totalAmount).toBe(totalAmount);
    expect(summary.percentage).toBe(percentage);
};

const createDebtTransferTransaction = (fromAccountId: number, toAccountId: number, amount: number, title: string): void => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.DEBT,
        title,
        externalSource: null,
        fromAccountId,
        toAccountId
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: fromAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });

    createTransactionEntry({
        transactionId: transaction.id,
        accountId: toAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null
    });
};

const createDebtReturnIncome = (cashAccountId: number, debtAccountId: number, categoryId: number, amount: number): void => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.INCOME,
        title: 'Alex returned money',
        externalSource: ExternalSourceEnum.MONOBANK,
        fromAccountId: null,
        toAccountId: cashAccountId
    });

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

const createDebtRepaymentExpense = (cashAccountId: number, debtAccountId: number, categoryId: number, amount: number): void => {
    const transaction = createTransaction({
        type: TransactionTypeEnum.EXPENSE,
        title: 'Return money to Alex',
        externalSource: ExternalSourceEnum.MONOBANK,
        fromAccountId: cashAccountId,
        toAccountId: null
    });

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
    const transaction = createTransaction({
        type: TransactionTypeEnum.INCOME,
        title: 'Alex returned money',
        externalSource: ExternalSourceEnum.MONOBANK,
        fromAccountId: null,
        toAccountId: cashAccountId
    });

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
    const transaction = createTransaction({
        type: TransactionTypeEnum.EXPENSE,
        title: 'Lend more money to Alex',
        externalSource: ExternalSourceEnum.MONOBANK,
        fromAccountId: cashAccountId,
        toAccountId: null
    });

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

const createTransaction = (
    transaction: Pick<TransactionCreateEntityInterface, 'type' | 'title' | 'externalSource' | 'fromAccountId' | 'toAccountId'>
) =>
    insertOne(TransactionEntityTable, {
        ...transaction,
        externalId: null,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        comment: '',
        exchangeRate: 1,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

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

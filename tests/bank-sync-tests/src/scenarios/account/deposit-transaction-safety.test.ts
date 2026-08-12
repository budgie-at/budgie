import { accountBalanceRepository, transactionRepository } from '@app/@generic/drizzle/db/db';
import { DepositTransactionSafetyErrorEnum } from '@app/account/enum/deposit-transaction-safety-error.enum';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { transactionService } from '@app/transaction/service/transaction.service';
import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { seed, testDb } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const OPERATED_AT_YEAR = 2026;
const LEGACY_EXPENSE_AMOUNT = 100 * PRECISION;
const LEGACY_INCOME_AMOUNT = 40 * PRECISION;
const LEGACY_NEGATIVE_BALANCE = 0 - LEGACY_EXPENSE_AMOUNT;
const IMPROVED_LEGACY_NEGATIVE_BALANCE = LEGACY_NEGATIVE_BALANCE + LEGACY_INCOME_AMOUNT;
const OPERATED_AT = new Date(OPERATED_AT_YEAR, 0, 15, 12, 0, 0);

const buildExpenseInput = (accountId: number, amount: number) => ({
    type: TransactionTypeEnum.EXPENSE,
    title: 'Deposit expense',
    amount,
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId: accountId,
    toAccountId: null,
    exchangeRate: 1,
    externalId: null,
    externalSource: null,
    updatedBy: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        }
    ]
});

const buildIncomeInput = (accountId: number, amount: number) => ({
    type: TransactionTypeEnum.INCOME,
    title: 'Deposit income',
    amount,
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId: null,
    toAccountId: accountId,
    exchangeRate: 1,
    externalId: null,
    externalSource: null,
    updatedBy: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        }
    ]
});

const buildTransferInput = (fromAccountId: number, toAccountId: number, amount: number) => ({
    type: TransactionTypeEnum.TRANSFER,
    title: 'Deposit transfer',
    amount,
    operatedAt: OPERATED_AT,
    comment: '',
    fromAccountId,
    toAccountId,
    exchangeRate: 1,
    externalId: null,
    externalSource: null,
    updatedBy: null,
    tagIds: [],
    entries: [
        {
            accountId: fromAccountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        },
        {
            accountId: toAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        }
    ]
});

const seedBalance = (accountId: number, amount: number): void => {
    insertOne(AccountBalanceEntityTable, {
        accountId,
        amount,
        updatedAt: OPERATED_AT
    });
};

const seedExpenseLedgerTransaction = (accountId: number, amount: number): void => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Legacy deposit expense',
        externalId: null,
        comment: '',
        operatedAt: OPERATED_AT,
        fromAccountId: accountId,
        toAccountId: null,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false
    });

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount,
        categoryId: null,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null,
        toIban: null,
        originalTransactionId: null
    });
};

const fetchCachedBalanceAmount = (accountId: number): number | undefined =>
    testDb.select().from(AccountBalanceEntityTable).where(eq(AccountBalanceEntityTable.accountId, accountId)).get()?.amount;

const fetchComputedBalance = (accountId: number): number => accountBalanceRepository.getByAccountId(accountId).get()?.balance ?? 0;

const fetchTransactionCount = (): number => testDb.select().from(TransactionEntityTable).all().length;

const fetchTransactionEntryCount = (): number => testDb.select().from(TransactionEntryEntityTable).all().length;

describe('account/deposit-transaction-safety', () => {
    it('rejects creating an expense from a funded deposit without changing rows or balances', async () => {
        const depositAccount = seed.account({ type: AccountTypeEnum.DEPOSIT });

        seedBalance(depositAccount.id, 100 * PRECISION);

        await expect(transactionService.createInternal(buildExpenseInput(depositAccount.id, 40))).rejects.toThrow(
            DepositTransactionSafetyErrorEnum.DEPOSIT_EXPENSE
        );

        expect(fetchTransactionCount()).toBe(0);
        expect(fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * PRECISION);
        expect(fetchComputedBalance(depositAccount.id)).toBe(100 * PRECISION);
    });

    it('rejects updating an existing transaction into a deposit expense and preserves the original transaction', async () => {
        const bankAccount = seed.account({ type: AccountTypeEnum.BANK });
        const depositAccount = seed.account({ type: AccountTypeEnum.DEPOSIT });
        const transaction = await transactionService.createInternal(buildExpenseInput(bankAccount.id, 20));

        seedBalance(depositAccount.id, 100 * PRECISION);

        await expect(transactionService.updateById(transaction.id, buildExpenseInput(depositAccount.id, 30))).rejects.toThrow(
            DepositTransactionSafetyErrorEnum.DEPOSIT_EXPENSE
        );

        const preservedTransaction = await transactionRepository.getByIdWithEntries(transaction.id);

        expect(preservedTransaction?.type).toBe(TransactionTypeEnum.EXPENSE);
        expect(preservedTransaction?.fromAccountId).toBe(bankAccount.id);
        expect(preservedTransaction?.entries.map(entry => entry.accountId)).toEqual([bankAccount.id]);
        expect(fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * PRECISION);
    });

    it('rejects an overdrawing transfer from a deposit and rolls back transaction rows and balances', async () => {
        const depositAccount = seed.account({ type: AccountTypeEnum.DEPOSIT });
        const bankAccount = seed.account({ type: AccountTypeEnum.BANK });

        seedBalance(depositAccount.id, 50 * PRECISION);

        await expect(transactionService.createInternalTransfer(buildTransferInput(depositAccount.id, bankAccount.id, 70))).rejects.toThrow(
            DepositTransactionSafetyErrorEnum.NEGATIVE_DEPOSIT_BALANCE
        );

        expect(fetchTransactionCount()).toBe(0);
        expect(fetchTransactionEntryCount()).toBe(0);
        expect(fetchCachedBalanceAmount(depositAccount.id)).toBe(50 * PRECISION);
        expect(fetchComputedBalance(depositAccount.id)).toBe(50 * PRECISION);
    });

    it('allows improving a pre-existing negative deposit balance but rejects worsening it', async () => {
        const depositAccount = seed.account({ type: AccountTypeEnum.DEPOSIT });

        seedExpenseLedgerTransaction(depositAccount.id, LEGACY_EXPENSE_AMOUNT);
        seedBalance(depositAccount.id, LEGACY_NEGATIVE_BALANCE);

        await transactionService.createInternal(buildIncomeInput(depositAccount.id, 40));

        expect(fetchCachedBalanceAmount(depositAccount.id)).toBe(IMPROVED_LEGACY_NEGATIVE_BALANCE);

        await expect(
            transactionService.createInternalTransfer(buildTransferInput(depositAccount.id, seed.account().id, 50))
        ).rejects.toThrow(DepositTransactionSafetyErrorEnum.NEGATIVE_DEPOSIT_BALANCE);

        expect(fetchCachedBalanceAmount(depositAccount.id)).toBe(IMPROVED_LEGACY_NEGATIVE_BALANCE);
    });

    it('allows a full rebuild when a legacy negative deposit balance is unchanged', async () => {
        const depositAccount = seed.account({ type: AccountTypeEnum.DEPOSIT });

        seedExpenseLedgerTransaction(depositAccount.id, LEGACY_EXPENSE_AMOUNT);
        seedBalance(depositAccount.id, LEGACY_NEGATIVE_BALANCE);

        await accountBalanceIncrementalService.updateAllBalances(true);

        expect(fetchCachedBalanceAmount(depositAccount.id)).toBe(LEGACY_NEGATIVE_BALANCE);
    });
});

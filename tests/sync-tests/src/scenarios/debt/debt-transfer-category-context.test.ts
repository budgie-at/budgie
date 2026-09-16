import { statisticsRepository } from '@app/@generic/drizzle/db/db';
import { SystemCategoryIdEnum } from '@app/category/enum/system-category-id.enum';
import { transactionTransferService } from '@app/transaction/service/transaction-transfer.service';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    CategoryEntityTable,
    CategorySourceEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type {
    AccountEntityInterface,
    CategoryEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

const TRANSFERRED_AMOUNT = 250 * PRECISION;

const fetchUserCategory = (): CategoryEntityInterface => {
    const category = testDb
        .select()
        .from(CategoryEntityTable)
        .all()
        .find(row => !row.isSystemCategory);

    if (!isDefined(category)) {
        throw new Error('No user-facing category seeded');
    }

    return category;
};

const fetchPrimaryEntries = (transactionId: number): TransactionEntryEntityInterface[] =>
    testDb
        .select()
        .from(TransactionEntryEntityTable)
        .all()
        .filter(row => row.transactionId === transactionId && row.kind === TransactionEntryKindEnum.PRIMARY);

const createDebtAccount = (): AccountEntityInterface =>
    seed.account({
        title: 'Transfer debt account',
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.LENT,
        targetBalance: 500 * PRECISION
    });

const createExpense = (cashAccountId: number, categoryId: number | null) => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Lent to Alex',
        externalId: null,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: new Date('2026-06-02T12:00:00.000Z'),
        comment: '',
        exchangeRate: 1,
        updatedBy: null,
        fromAccountId: cashAccountId,
        toAccountId: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount: TRANSFERRED_AMOUNT,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: TRANSFERRED_AMOUNT,
        toIban: null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction;
};

const convertToDebtTransfer = async (categoryId: number | null): Promise<TransactionEntryEntityInterface[]> => {
    const cashAccount = seed.account({ title: 'Transfer cash account', type: AccountTypeEnum.BANK_SYNC });
    const debtAccount = createDebtAccount();
    const transaction = createExpense(cashAccount.id, categoryId);

    await transactionTransferService.convertExpenseToTransfer({ id: transaction.id, accountId: debtAccount.id, customExchangeRate: 0 });

    return fetchPrimaryEntries(transaction.id);
};

const readExpenseTotal = (instrumentId: number): number =>
    statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, instrumentId).get()?.expense ?? -1;

describe('debt transfer category context', () => {
    it('keeps the source category on both sides of a debt-account transfer', async () => {
        const userCategory = fetchUserCategory();

        const entries = await convertToDebtTransfer(userCategory.id);

        expect(entries).toHaveLength(2);
        entries.forEach(entry => {
            expect(entry.categoryId).toBe(userCategory.id);
            expect(entry.categorySource).toBe(CategorySourceEnum.USER);
        });
    });

    it('marks the transaction as a debt transfer while keeping the category', async () => {
        const userCategory = fetchUserCategory();
        const entries = await convertToDebtTransfer(userCategory.id);
        const transaction = testDb
            .select()
            .from(TransactionEntityTable)
            .all()
            .find(row => row.id === entries[0].transactionId);

        expect(transaction?.type).toBe(TransactionTypeEnum.DEBT);
        expect(entries[0].categoryId).toBe(userCategory.id);
    });

    it('falls back to the currency transfer category when the source had none', async () => {
        const entries = await convertToDebtTransfer(null);

        entries.forEach(entry => {
            expect(entry.categoryId).toBe(SystemCategoryIdEnum.CURRENCY_TRANSFER);
        });
    });

    it('keeps the converted debt transfer out of expense totals', async () => {
        const userCategory = fetchUserCategory();
        const entries = await convertToDebtTransfer(userCategory.id);
        const cashEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);

        expect(isDefined(cashEntry)).toBe(true);
        expect(readExpenseTotal(1)).toBe(0);
    });
});

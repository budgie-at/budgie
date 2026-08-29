import { transactionImportService } from '@app/transaction/service/transaction-import.service';
import * as Contracts from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { seed, testDb } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type { ImportedBatchPreparationInterface } from '@app/transaction/interface/imported-batch-preparation.interface';

const OPERATED_AT_YEAR = 2026;
const DEPOSIT_EXPENSE_ERROR = 'Deposit accounts cannot fund expenses';
const OPERATED_AT = new Date(OPERATED_AT_YEAR, 0, 15, 12, 0, 0);
const IMPORT_EXTERNAL_ID = 'deposit-file-import-expense';
const IMPORT_UPDATED_AMOUNT = 40;
const IMPORT_INITIAL_AMOUNT = 20 * Contracts.PRECISION;

const buildImportInput = (accountId: number, amount = IMPORT_UPDATED_AMOUNT): Contracts.TransactionCreateInputInterface => ({
    amount,
    title: 'Deposit file import expense',
    comment: 'updated',
    type: Contracts.TransactionTypeEnum.EXPENSE,
    exchangeRate: 1,
    operatedAt: OPERATED_AT,
    externalId: IMPORT_EXTERNAL_ID,
    externalSource: Contracts.ExternalSourceEnum.ERSTE,
    updatedBy: null,
    fromAccountId: accountId,
    toAccountId: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: Contracts.TransactionEntryTypeEnum.CREDIT,
            kind: Contracts.TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null,
            externalId: IMPORT_EXTERNAL_ID,
            exchangeRate: 1,
            toIban: null
        }
    ]
});

const buildPrepared = (input: Contracts.TransactionCreateInputInterface, existingTransactionIdMap = new Map<string, number>()) => ({
    externalIdMap: existingTransactionIdMap,
    transactionInputs: [input]
});

const seedBalance = (accountId: number): void => {
    insertOne(Contracts.AccountBalanceEntityTable, {
        accountId,
        amount: 100 * Contracts.PRECISION,
        updatedAt: OPERATED_AT
    });
};

const seedImportedExpense = (accountId: number): number => {
    const transaction = insertOne(Contracts.TransactionEntityTable, {
        type: Contracts.TransactionTypeEnum.EXPENSE,
        title: 'Original imported deposit expense',
        externalId: IMPORT_EXTERNAL_ID,
        comment: 'original',
        operatedAt: OPERATED_AT,
        fromAccountId: accountId,
        toAccountId: null,
        exchangeRate: 1,
        externalSource: Contracts.ExternalSourceEnum.ERSTE,
        updatedBy: null,
        needsEmbedding: false
    });

    insertOne(Contracts.TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: Contracts.TransactionEntryTypeEnum.CREDIT,
        kind: Contracts.TransactionEntryKindEnum.PRIMARY,
        amount: IMPORT_INITIAL_AMOUNT,
        categoryId: null,
        mccCategoryId: null,
        externalId: IMPORT_EXTERNAL_ID,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null,
        toIban: null,
        originalTransactionId: null
    });

    return transaction.id;
};

const fetchCachedBalanceAmount = (accountId: number): number | undefined =>
    testDb.select().from(Contracts.AccountBalanceEntityTable).where(eq(Contracts.AccountBalanceEntityTable.accountId, accountId)).get()
        ?.amount;

describe('import/deposit-import-safety', () => {
    it('rejects new prepared imported deposit expenses without changing rows or balances', async () => {
        const depositAccount = seed.account({ type: Contracts.AccountTypeEnum.DEPOSIT });
        const prepared = buildPrepared(buildImportInput(depositAccount.id));

        seedBalance(depositAccount.id);

        await expect(transactionImportService.bulkUpsertPreparedImported(prepared)).rejects.toThrow(DEPOSIT_EXPENSE_ERROR);

        expect(testDb.select().from(Contracts.TransactionEntityTable).all()).toHaveLength(0);
        expect(testDb.select().from(Contracts.TransactionEntryEntityTable).all()).toHaveLength(0);
        expect(fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * Contracts.PRECISION);
    });

    it('rejects prepared imported refreshes for existing deposit expenses and preserves rows', async () => {
        const depositAccount = seed.account({ type: Contracts.AccountTypeEnum.DEPOSIT });
        const transactionId = seedImportedExpense(depositAccount.id);
        const prepared: ImportedBatchPreparationInterface = buildPrepared(
            buildImportInput(depositAccount.id),
            new Map([[IMPORT_EXTERNAL_ID, transactionId]])
        );

        seedBalance(depositAccount.id);

        await expect(transactionImportService.bulkUpsertPreparedImported(prepared)).rejects.toThrow(DEPOSIT_EXPENSE_ERROR);

        const transaction = testDb
            .select()
            .from(Contracts.TransactionEntityTable)
            .where(eq(Contracts.TransactionEntityTable.id, transactionId))
            .get();
        const entry = testDb
            .select()
            .from(Contracts.TransactionEntryEntityTable)
            .where(eq(Contracts.TransactionEntryEntityTable.transactionId, transactionId))
            .get();

        expect(transaction?.title).toBe('Original imported deposit expense');
        expect(transaction?.comment).toBe('original');
        expect(entry?.amount).toBe(IMPORT_INITIAL_AMOUNT);
        expect(fetchCachedBalanceAmount(depositAccount.id)).toBe(100 * Contracts.PRECISION);
    });
});

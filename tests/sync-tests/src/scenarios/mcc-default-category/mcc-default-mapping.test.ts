import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { BANK_FEE_CATEGORY_ID, CategorySourceEnum, MCC_DEFAULT_CATEGORY_SEED, TransactionEntryTypeEnum } from '@budgie/contracts';
import { SyncProviderEnum, SyncTransactionTypeEnum } from '@budgie/sync';
import { describe, expect, it } from 'vitest';

import type { MccCategoryLookupInterface } from '@budgie/contracts';
import type { SyncTransactionInterface } from '@budgie/sync';

const makeExpenseTransaction = (overrides: Partial<SyncTransactionInterface> = {}): SyncTransactionInterface => ({
    id: 'tx-test-1',
    time: Math.floor(Date.now() / 1000),
    description: 'Test transaction',
    mcc: 5411,
    originalMcc: 5411,
    amount: -2500,
    operationAmount: -2500,
    currencyCode: 980,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 100000,
    hold: false,
    provider: SyncProviderEnum.MONOBANK,
    accountId: 'mono-acc-1',
    type: SyncTransactionTypeEnum.EXPENSE,
    feeAmount: 0,
    ...overrides
});

const ACCOUNT_ID = 1;
const FEE_CARD_AMOUNT_NEGATIVE = -30300;
const FEE_CARD_AMOUNT = 30300;
const FEE_OPERATION_AMOUNT_NEGATIVE = -30000;

const makeFeeTransaction = (): SyncTransactionInterface =>
    makeExpenseTransaction({ amount: FEE_CARD_AMOUNT_NEGATIVE, operationAmount: FEE_OPERATION_AMOUNT_NEGATIVE, feeAmount: 300 });

const expectFeeEntryMapping = (result: ReturnType<typeof mapBankTransactionToCreateInput>): void => {
    const categoryEntries = result.entries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE);
    const feeEntries = result.entries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE);

    expect(result.amount).toBe(FEE_CARD_AMOUNT);
    expect(result.entries).toHaveLength(2);
    expect(categoryEntries).toHaveLength(1);
    expect(feeEntries).toHaveLength(1);
    expect(categoryEntries[0]).toEqual(expect.objectContaining({ amount: 30000, categoryId: 42, exchangeRate: 1 }));
    expect(feeEntries[0]).toEqual(
        expect.objectContaining({
            type: TransactionEntryTypeEnum.FEE,
            amount: 300,
            categoryId: BANK_FEE_CATEGORY_ID,
            categorySource: CategorySourceEnum.FEE,
            externalId: 'tx-test-1:fee'
        })
    );
};

describe('mcc-default-category/mcc-default-mapping', () => {
    it('MCC_DEFAULT_CATEGORY_SEED has at least 1000 entries', () => {
        expect(Object.keys(MCC_DEFAULT_CATEGORY_SEED).length).toBeGreaterThanOrEqual(1000);
    });

    it('applies defaultCategoryId from lookup when input has no categoryId', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: 42 };
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, lookup);

        expect(result.entries[0].categoryId).toBe(42);
        expect(result.entries[0].categorySource).toBe(CategorySourceEnum.MCC_DEFAULT);
        expect(result.entries[0].mccCategoryId).toBe(999);
    });

    it('leaves categoryId null when lookup has no defaultCategoryId set', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: null };
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, lookup);

        expect(result.entries[0].categoryId).toBeNull();
        expect(result.entries[0].categorySource).toBe(CategorySourceEnum.USER);
        expect(result.entries[0].mccCategoryId).toBe(999);
    });

    it('leaves categoryId and mccCategoryId null when lookup is null (update-path)', () => {
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, null);

        expect(result.entries[0].categoryId).toBeNull();
        expect(result.entries[0].categorySource).toBe(CategorySourceEnum.USER);
        expect(result.entries[0].mccCategoryId).toBeNull();
    });

    it('keeps a single entry when there is no fee', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: 42 };
        const bankTransaction = makeExpenseTransaction({ feeAmount: 0 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, lookup);

        expect(result.entries).toHaveLength(1);
        expect(result.entries[0].amount).toBe(2500);
    });

    it('creates a fee entry without turning the transaction into category splits', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: 42 };
        const result = mapBankTransactionToCreateInput(makeFeeTransaction(), ACCOUNT_ID, lookup);

        expectFeeEntryMapping(result);
    });
});

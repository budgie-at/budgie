import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { SyncProviderEnum, BankTransactionTypeEnum } from '@budgie/bank-sync';
import {
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    ExternalSourceEnum,
    MCC_DEFAULT_CATEGORY_SEED,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import type { BankTransactionInterface } from '@budgie/bank-sync';
import type { MccCategoryLookupInterface } from '@budgie/contracts';

const makeExpenseTransaction = (overrides: Partial<BankTransactionInterface> = {}): BankTransactionInterface => ({
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
    type: BankTransactionTypeEnum.EXPENSE,
    feeAmount: 0,
    ...overrides
});

const ACCOUNT_ID = 1;
const PROVIDER = ExternalSourceEnum.MONOBANK;
const FEE_CARD_AMOUNT_NEGATIVE = -30300;
const FEE_CARD_AMOUNT = 30300;
const FEE_OPERATION_AMOUNT_NEGATIVE = -30000;

const makeFeeTransaction = (): BankTransactionInterface =>
    makeExpenseTransaction({ amount: FEE_CARD_AMOUNT_NEGATIVE, operationAmount: FEE_OPERATION_AMOUNT_NEGATIVE, feeAmount: 300 });

describe('mcc-default-category/mcc-default-mapping', () => {
    it('MCC_DEFAULT_CATEGORY_SEED has at least 1000 entries', () => {
        expect(Object.keys(MCC_DEFAULT_CATEGORY_SEED).length).toBeGreaterThanOrEqual(1000);
    });

    it('applies defaultCategoryId from lookup when input has no categoryId', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: 42 };
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, lookup, PROVIDER);

        expect(result.entries[0].categoryId).toBe(42);
        expect(result.entries[0].categorySource).toBe(CategorySourceEnum.MCC_DEFAULT);
        expect(result.entries[0].mccCategoryId).toBe(999);
    });

    it('leaves categoryId null when lookup has no defaultCategoryId set', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: null };
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, lookup, PROVIDER);

        expect(result.entries[0].categoryId).toBeNull();
        expect(result.entries[0].categorySource).toBe(CategorySourceEnum.USER);
        expect(result.entries[0].mccCategoryId).toBe(999);
    });

    it('leaves categoryId and mccCategoryId null when lookup is null (update-path)', () => {
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, null, PROVIDER);

        expect(result.entries[0].categoryId).toBeNull();
        expect(result.entries[0].categorySource).toBe(CategorySourceEnum.USER);
        expect(result.entries[0].mccCategoryId).toBeNull();
    });

    it('keeps a single entry when there is no fee', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: 42 };
        const bankTransaction = makeExpenseTransaction({ feeAmount: 0 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, lookup, PROVIDER);

        expect(result.entries).toHaveLength(1);
        expect(result.entries[0].amount).toBe(2500);
    });

    it('creates a fee entry without turning the transaction into category splits', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: 42 };
        const result = mapBankTransactionToCreateInput(makeFeeTransaction(), ACCOUNT_ID, lookup, PROVIDER);
        const categoryEntries = result.entries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE);
        const feeEntries = result.entries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE);

        expect(result.amount).toBe(FEE_CARD_AMOUNT);
        expect(result.entries).toHaveLength(2);
        expect(categoryEntries).toHaveLength(1);
        expect(feeEntries).toHaveLength(1);
        expect(categoryEntries[0].amount).toBe(30000);
        expect(categoryEntries[0].categoryId).toBe(42);
        expect(categoryEntries[0].exchangeRate).toBe(1);
        expect(feeEntries[0].type).toBe(TransactionEntryTypeEnum.FEE);
        expect(feeEntries[0].amount).toBe(300);
        expect(feeEntries[0].categoryId).toBe(BANK_FEE_CATEGORY_ID);
        expect(feeEntries[0].categorySource).toBe(CategorySourceEnum.FEE);
        expect(feeEntries[0].externalId).toBe('tx-test-1:fee');
    });
});

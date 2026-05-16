import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { BankProviderEnum, BankTransactionTypeEnum } from '@budgie/bank-sync';
import { ExternalSourceEnum, MCC_DEFAULT_CATEGORY_SEED } from '@budgie/contracts';
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
    provider: BankProviderEnum.MONOBANK,
    accountId: 'mono-acc-1',
    type: BankTransactionTypeEnum.EXPENSE,
    ...overrides
});

const ACCOUNT_ID = 1;
const PROVIDER = ExternalSourceEnum.MONOBANK;

describe('mcc-default-category/mcc-default-mapping', () => {
    it('MCC_DEFAULT_CATEGORY_SEED has at least 80 entries', () => {
        expect(Object.keys(MCC_DEFAULT_CATEGORY_SEED).length).toBeGreaterThanOrEqual(80);
    });

    it('applies defaultCategoryId from lookup when input has no categoryId', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: 42 };
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, lookup, PROVIDER);

        expect(result.entries[0].categoryId).toBe(42);
        expect(result.entries[0].mccCategoryId).toBe(999);
    });

    it('leaves categoryId null when lookup has no defaultCategoryId set', () => {
        const lookup: MccCategoryLookupInterface = { id: 999, defaultCategoryId: null };
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, lookup, PROVIDER);

        expect(result.entries[0].categoryId).toBeNull();
        expect(result.entries[0].mccCategoryId).toBe(999);
    });

    it('leaves categoryId and mccCategoryId null when lookup is null (update-path)', () => {
        const bankTransaction = makeExpenseTransaction({ mcc: 5411 });

        const result = mapBankTransactionToCreateInput(bankTransaction, ACCOUNT_ID, null, PROVIDER);

        expect(result.entries[0].categoryId).toBeNull();
        expect(result.entries[0].mccCategoryId).toBeNull();
    });
});

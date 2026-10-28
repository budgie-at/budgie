import { ExternalSourceEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { SyncProviderEnum, SyncTransactionTypeEnum, mapBankTransactionToCreateInput } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';

import type { SyncTransactionInterface } from '@budgie/sync';

const ACCOUNT_ID = 1;

const buildMonobankTransaction = (type: SyncTransactionTypeEnum, amount: number, feeAmount: number): SyncTransactionInterface => ({
    provider: SyncProviderEnum.MONOBANK,
    accountId: 'mono-account',
    id: 'mono-fee-1',
    time: 1_700_000_000,
    description: 'Card top-up',
    mcc: 0,
    originalMcc: 0,
    amount,
    operationAmount: amount,
    currencyCode: 980,
    commissionRate: feeAmount,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    type,
    feeAmount
});

const netEffect = (entries: readonly { readonly type: TransactionEntryTypeEnum; readonly amount: number }[]): number =>
    entries.reduce((sum, entry) => sum + (entry.type === TransactionEntryTypeEnum.DEBIT ? entry.amount : -entry.amount), 0);

describe('sync/income-with-fee-entries', () => {
    it.each([
        { type: SyncTransactionTypeEnum.INCOME, expectedNet: 100 },
        { type: SyncTransactionTypeEnum.EXPENSE, expectedNet: -100 }
    ])('nets a $type to its provider-reported amount when the provider reports a fee', ({ type, expectedNet }) => {
        const input = mapBankTransactionToCreateInput(buildMonobankTransaction(type, 100, 2), ACCOUNT_ID, null, ExternalSourceEnum.MONOBANK);

        expect(netEffect(input.entries)).toBe(expectedNet);
    });
});

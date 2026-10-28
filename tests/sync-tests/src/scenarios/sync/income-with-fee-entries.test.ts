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
    it('nets an income to its provider-reported amount when the provider reports a fee', () => {
        const input = mapBankTransactionToCreateInput(
            buildMonobankTransaction(SyncTransactionTypeEnum.INCOME, 100, 2),
            ACCOUNT_ID,
            null,
            ExternalSourceEnum.MONOBANK
        );

        expect(netEffect(input.entries)).toBe(100);
    });

    it('nets an expense to its provider-reported amount when the provider reports a fee', () => {
        const input = mapBankTransactionToCreateInput(
            buildMonobankTransaction(SyncTransactionTypeEnum.EXPENSE, 100, 2),
            ACCOUNT_ID,
            null,
            ExternalSourceEnum.MONOBANK
        );

        expect(netEffect(input.entries)).toBe(-100);
    });
});

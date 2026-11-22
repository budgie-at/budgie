import { AccountTypeEnum, SyncModeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { getAdjustmentDetails } from '../src/transaction/utils/get-adjustment-details.util';

import { buildAccountWithInstrument } from './fixture/account-with-instrument';
import { buildPrimaryEntry } from './fixture/transaction-entry';
import { buildTransaction } from './fixture/transaction-with-relations';

import type { AccountWithInstrumentEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

type SyncInput = NonNullable<Parameters<typeof getAdjustmentDetails>[1]>;

const OPERATED_AT = new Date('2026-10-10T12:00:00Z');
const AMOUNT = 25_000_000;

const buildAccount = (type: AccountTypeEnum): AccountWithInstrumentEntityInterface => ({
    ...buildAccountWithInstrument(1, type, 'Account'),
    syncId: 'account-sync-id'
});

const buildAdjustment = (accountType: AccountTypeEnum): TransactionWithRelationsEntityInterface => {
    const account = buildAccount(accountType);

    return buildTransaction({
        id: 7,
        syncId: 'transaction-sync-id',
        type: TransactionTypeEnum.ADJUSTMENT,
        title: 'Balance adjustment',
        operatedAt: OPERATED_AT,
        toAccountId: account.id,
        operatedWeekday: 6,
        operatedMinuteOfDay: 720,
        entries: [
            buildPrimaryEntry({
                id: 1,
                syncId: 'entry-sync-id',
                type: TransactionEntryTypeEnum.DEBIT,
                accountId: account.id,
                transactionId: 7,
                amount: AMOUNT,
                baseAmount: null,
                account
            })
        ],
        toAccount: account
    });
};

const buildSync = (overrides: Partial<SyncInput>): SyncInput => ({
    mode: SyncModeEnum.FORWARD,
    setupBalance: null,
    reconciledAt: null,
    reconciledBalance: null,
    reconciliationTransactionId: null,
    ...overrides
});

describe('adjustment details balance fixing', () => {
    it('leaves a manual account without sync unfixed', () => {
        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.CASH), null)?.isBalanceFixed).toBe(false);
    });

    it('fixes a bank-authoritative account regardless of sync', () => {
        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.CRYPTO_SYNC), null)?.isBalanceFixed).toBe(true);
    });

    it('fixes the balance while the initial history import pins it to the setup balance', () => {
        const sync = buildSync({ mode: SyncModeEnum.BACKWARD, setupBalance: 100_000_000 });

        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), sync)?.isBalanceFixed).toBe(true);
    });

    it('leaves a backward-syncing account without a setup balance unfixed', () => {
        const sync = buildSync({ mode: SyncModeEnum.BACKWARD });

        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), sync)?.isBalanceFixed).toBe(false);
    });

    it('leaves a forward-syncing account with a leftover setup balance unfixed', () => {
        const sync = buildSync({ setupBalance: 100_000_000 });

        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), sync)?.isBalanceFixed).toBe(false);
    });

    it('fixes an adjustment at or before the forward reconciliation point only', () => {
        const reconciledAt = new Date('2026-10-10T12:00:00Z');
        const reconciled = buildSync({ reconciledAt, reconciledBalance: AMOUNT });
        const earlier = buildSync({ reconciledAt: new Date('2026-10-09T12:00:00Z'), reconciledBalance: AMOUNT });

        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), reconciled)?.isBalanceFixed).toBe(true);
        expect(getAdjustmentDetails(buildAdjustment(AccountTypeEnum.BANK_SYNC), earlier)?.isBalanceFixed).toBe(false);
    });
});

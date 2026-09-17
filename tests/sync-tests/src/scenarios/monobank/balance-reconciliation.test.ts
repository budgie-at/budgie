import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    SyncBalanceAuthorityEnum,
    SyncModeEnum,
    SyncStatusEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchSyncById, seed, stubMonobankProviderBalance } from '../../harness';
import { fetchMonobankAdjustments } from '../../harness/db/fetch-monobank-adjustments';
import { insertOne } from '../../harness/db/insert-one';

const EXTERNAL_ID = 'mono-reconciled';
const PROVIDER_BALANCE_UNITS = 100;
const PROVIDER_BALANCE = 1_000_000;

const seedLedgerBalance = (accountId: number, ledgerBalance: number): void => {
    if (ledgerBalance === 0) {
        return;
    }

    const transaction = insertOne(TransactionEntityTable, {
        type: ledgerBalance > 0 ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
        title: 'Ledger transaction',
        externalId: null,
        comment: '',
        toAccountId: ledgerBalance > 0 ? accountId : null,
        fromAccountId: ledgerBalance > 0 ? null : accountId,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false
    });
    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: ledgerBalance > 0 ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
        amount: Math.abs(ledgerBalance),
        categoryId: null,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: Math.abs(ledgerBalance),
        toIban: null,
        originalTransactionId: null
    });
};

const seedAnchoredLedger = (ledgerBalance: number, adjustmentTransactionId: number | null = null) => {
    const account = seed.account({
        externalId: EXTERNAL_ID,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: 1
    });
    const sync = seed.sync({
        accountId: account.id,
        mode: SyncModeEnum.FORWARD,
        status: SyncStatusEnum.IDLE,
        balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
        balanceAdjustmentTransactionId: adjustmentTransactionId
    });
    insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: PROVIDER_BALANCE, updatedAt: new Date() });
    seedLedgerBalance(account.id, ledgerBalance);
    stubMonobankProviderBalance(EXTERNAL_ID, PROVIDER_BALANCE_UNITS);

    return { account, sync };
};

describe('monobank/balance-reconciliation', () => {
    it('keeps an equal ledger without an adjustment', async () => {
        const fixture = seedAnchoredLedger(PROVIDER_BALANCE);

        await monobankSyncService.sync();

        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(0);
        expect(fetchSyncById(fixture.sync.id).balanceAdjustmentTransactionId).toBeNull();
    });

    it('creates one positive correction and makes a committed retry a no-op', async () => {
        const fixture = seedAnchoredLedger(700_000);

        await monobankSyncService.sync();
        await monobankSyncService.sync();

        expect(fetchMonobankAdjustments(fixture.account.id)).toStrictEqual([
            expect.objectContaining({ amount: 300_000, entryType: TransactionEntryTypeEnum.DEBIT })
        ]);
        expect(accountBalanceRepository.getByAccountId(fixture.account.id).get()?.balance).toBe(PROVIDER_BALANCE);
        expect(fetchSyncById(fixture.sync.id).balanceAuthority).toBe(SyncBalanceAuthorityEnum.LEDGER);
    });

    it('creates a credit correction for a negative delta', async () => {
        const fixture = seedAnchoredLedger(1_200_000);

        await monobankSyncService.sync();

        expect(fetchMonobankAdjustments(fixture.account.id)).toStrictEqual([
            expect.objectContaining({ amount: 200_000, entryType: TransactionEntryTypeEnum.CREDIT })
        ]);
    });

    it('recovers when the recorded old adjustment was manually deleted', async () => {
        const fixture = seedAnchoredLedger(700_000, 99_999);

        await monobankSyncService.sync();

        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(1);
        expect(fetchSyncById(fixture.sync.id).balanceAdjustmentTransactionId).not.toBe(99_999);
    });
});

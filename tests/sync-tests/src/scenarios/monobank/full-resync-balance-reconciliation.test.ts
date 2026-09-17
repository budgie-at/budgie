import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { resyncService } from '@app/sync/service/resync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    SyncBalanceAuthorityEnum,
    SyncModeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { buildMonobank, fetchSyncById, monobankStub, seed } from '../../harness';
import { fetchMonobankAdjustments } from '../../harness/db/fetch-monobank-adjustments';
import { insertOne } from '../../harness/db/insert-one';

const seedDebitEntry = (accountId: number, amount: number, transactionType: TransactionTypeEnum): number => {
    const transaction = insertOne(TransactionEntityTable, {
        type: transactionType,
        title: '',
        externalId: null,
        comment: '',
        toAccountId: accountId,
        fromAccountId: null,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false
    });
    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount,
        categoryId: null,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: amount,
        toIban: null,
        originalTransactionId: null
    });

    return transaction.id;
};

const seedPreviouslyReconciledAccount = () => {
    const externalId = 'mono-resync';
    const account = seed.account({
        externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: 1
    });
    seedDebitEntry(account.id, 700_000, TransactionTypeEnum.INCOME);
    const oldAdjustmentId = seedDebitEntry(account.id, 300_000, TransactionTypeEnum.ADJUSTMENT);
    const sync = seed.sync({
        accountId: account.id,
        mode: SyncModeEnum.FORWARD,
        balanceAuthority: SyncBalanceAuthorityEnum.LEDGER,
        balanceAdjustmentTransactionId: oldAdjustmentId
    });
    insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: 1_000_000, updatedAt: new Date() });

    return { account, externalId, oldAdjustmentId, sync };
};

const waitForResync = async (): Promise<void> => {
    await syncWorkloadService.run('wait-for-resync', async () => Promise.resolve());
    await monobankSyncService.sync();
};

describe('monobank/full-resync-balance-reconciliation', () => {
    it('replaces rather than accumulates the automatic correction', async () => {
        const fixture = seedPreviouslyReconciledAccount();
        monobankStub.clientInfo(
            buildMonobank.clientInfo({ accounts: [buildMonobank.account({ id: fixture.externalId, balance: 200 })], jars: [] })
        );
        monobankStub.statement([]);

        await resyncService.resync({ accountId: fixture.account.id, sinceDays: null });
        await waitForResync();

        const adjustments = fetchMonobankAdjustments(fixture.account.id);
        expect(adjustments).toHaveLength(1);
        expect(adjustments[0]?.id).not.toBe(fixture.oldAdjustmentId);
        expect(fetchSyncById(fixture.sync.id).balanceAuthority).toBe(SyncBalanceAuthorityEnum.LEDGER);
    });

    it('removes the old correction when the refreshed provider balance matches the ledger', async () => {
        const fixture = seedPreviouslyReconciledAccount();
        monobankStub.clientInfo(
            buildMonobank.clientInfo({ accounts: [buildMonobank.account({ id: fixture.externalId, balance: 70 })], jars: [] })
        );
        monobankStub.statement([]);

        await resyncService.resync({ accountId: fixture.account.id, sinceDays: null });
        await waitForResync();

        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(0);
        expect(fetchSyncById(fixture.sync.id).balanceAdjustmentTransactionId).toBeNull();
    });

    it('leaves authority and correction untouched for a windowed resync', async () => {
        const fixture = seedPreviouslyReconciledAccount();
        monobankStub.statement([]);

        await resyncService.resync({ accountId: fixture.account.id, sinceDays: 30 });
        await waitForResync();

        expect(fetchSyncById(fixture.sync.id)).toMatchObject({
            balanceAuthority: SyncBalanceAuthorityEnum.LEDGER,
            balanceAdjustmentTransactionId: fixture.oldAdjustmentId
        });
        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(1);
    });
});

import { accountBalanceRepository, syncRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { SYNC_ERROR_THRESHOLD } from '@app/sync/constant/sync-error-threshold.constant';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import {
    SyncBalanceAuthorityEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { buildMonobank, fetchSyncById, monobankStub, seedExpenseEntry, stubMonobankProviderBalance, testDb } from '../../harness';
import { fetchMonobankAdjustments } from '../../harness/db/fetch-monobank-adjustments';
import { insertOne } from '../../harness/db/insert-one';
import { setupAnchoredMonobankFixture } from '../../harness/monobank/setup-anchored-monobank-fixture';

describe('monobank/reconciliation-recovery', () => {
    it('releases provider authority against the stored anchor when repeated failures disable the sync', async () => {
        const fixture = setupAnchoredMonobankFixture();
        seedExpenseEntry(fixture.account.id, 200_000, 'Imported expense');
        await syncRepository.update(fixture.sync.id, { errorCount: SYNC_ERROR_THRESHOLD });
        monobankStub.statement([]);
        monobankStub.clientInfoFailure();

        await monobankSyncService.sync();

        expect(fetchSyncById(fixture.sync.id)).toMatchObject({
            enabled: false,
            balanceAuthority: SyncBalanceAuthorityEnum.LEDGER
        });
        expect(fetchMonobankAdjustments(fixture.account.id)).toStrictEqual([
            expect.objectContaining({ amount: 700_000, entryType: TransactionEntryTypeEnum.DEBIT })
        ]);
        expect(accountBalanceRepository.getByAccountId(fixture.account.id).get()?.balance).toBe(500_000);

        await accountBalanceIncrementalService.updateAllBalances(true);

        expect(accountBalanceRepository.getByAccountId(fixture.account.id).get()?.balance).toBe(500_000);
    });

    it('does not finalize after the run is interrupted during the provider response', async () => {
        const fixture = setupAnchoredMonobankFixture();
        monobankStub.statement([]);
        monobankStub.clientInfo(
            buildMonobank.clientInfo({
                accounts: [buildMonobank.account({ id: fixture.externalId, balance: 100 })],
                jars: []
            }),
            () => monobankSyncService.interruptActiveRun()
        );

        await monobankSyncService.sync();

        expect(fetchSyncById(fixture.sync.id).balanceAuthority).toBe(SyncBalanceAuthorityEnum.PROVIDER);
        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(0);
    });

    it('rolls back the correction and anchor mutation when finalization fails', async () => {
        const fixture = setupAnchoredMonobankFixture();
        const oldAdjustment = insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.ADJUSTMENT,
            title: '',
            externalId: null,
            comment: '',
            toAccountId: fixture.account.id,
            fromAccountId: null,
            exchangeRate: 1,
            externalSource: null,
            updatedBy: null,
            needsEmbedding: false
        });
        insertOne(TransactionEntryEntityTable, {
            transactionId: oldAdjustment.id,
            accountId: fixture.account.id,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: 100_000,
            categoryId: null,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: 1,
            baseExchangeRate: 1,
            baseAmount: 100_000,
            toIban: null,
            originalTransactionId: null
        });
        await syncRepository.update(fixture.sync.id, {
            balanceAdjustmentTransactionId: oldAdjustment.id,
            errorCount: SYNC_ERROR_THRESHOLD
        });
        const initialSync = fetchSyncById(fixture.sync.id);
        const [initialBalance] = await accountBalanceRepository.getByAccountIds([fixture.account.id]);
        await testDb.$client.runAsync(
            `CREATE TRIGGER fail_sync_finalization
             BEFORE UPDATE OF balance_authority ON bank_syncs
             WHEN NEW.balance_authority = 'LEDGER'
             BEGIN
                 SELECT RAISE(ABORT, 'forced finalization failure');
             END`
        );
        stubMonobankProviderBalance(fixture.externalId, 100);

        await monobankSyncService.sync();

        expect(fetchMonobankAdjustments(fixture.account.id)).toStrictEqual([
            expect.objectContaining({ id: oldAdjustment.id, amount: 100_000 })
        ]);
        expect(await accountBalanceRepository.getByAccountIds([fixture.account.id])).toStrictEqual([initialBalance]);
        expect(fetchSyncById(fixture.sync.id)).toMatchObject({
            balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
            balanceAdjustmentTransactionId: oldAdjustment.id,
            forwardSyncFromAt: initialSync.forwardSyncFromAt,
            forwardSyncedAt: initialSync.forwardSyncedAt
        });
    });
});

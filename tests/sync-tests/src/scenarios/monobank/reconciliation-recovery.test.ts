import { accountBalanceRepository, syncRepository } from '@app/@generic/drizzle/db/db';
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

import { buildMonobank, fetchSyncById, monobankStub, testDb } from '../../harness';
import { fetchMonobankAdjustments } from '../../harness/db/fetch-monobank-adjustments';
import { insertOne } from '../../harness/db/insert-one';
import { setupAnchoredMonobankFixture } from '../../harness/monobank/setup-anchored-monobank-fixture';

describe('monobank/reconciliation-recovery', () => {
    it('leaves anchor and progress unchanged when fresh provider retrieval fails', async () => {
        const fixture = setupAnchoredMonobankFixture();
        await syncRepository.update(fixture.sync.id, { errorCount: SYNC_ERROR_THRESHOLD });
        const initialSync = fetchSyncById(fixture.sync.id);
        monobankStub.statement([]);
        monobankStub.clientInfoFailure();

        await monobankSyncService.sync();

        expect(fetchSyncById(fixture.sync.id)).toMatchObject({
            balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
            forwardSyncFromAt: initialSync.forwardSyncFromAt,
            forwardSyncedAt: null
        });
        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(0);
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
        const initialBalance = accountBalanceRepository.getByAccountId(fixture.account.id).get()?.balance;
        await testDb.$client.runAsync(
            `CREATE TRIGGER fail_sync_finalization
             BEFORE UPDATE OF balance_authority ON bank_syncs
             WHEN NEW.balance_authority = 'LEDGER'
             BEGIN
                 SELECT RAISE(ABORT, 'forced finalization failure');
             END`
        );
        monobankStub.statement([]);
        monobankStub.clientInfo(
            buildMonobank.clientInfo({
                accounts: [buildMonobank.account({ id: fixture.externalId, balance: 100 })],
                jars: []
            })
        );

        await monobankSyncService.sync();

        expect(fetchMonobankAdjustments(fixture.account.id)).toStrictEqual([
            expect.objectContaining({ id: oldAdjustment.id, amount: 100_000 })
        ]);
        expect(accountBalanceRepository.getByAccountId(fixture.account.id).get()?.balance).toBe(initialBalance);
        expect(fetchSyncById(fixture.sync.id)).toMatchObject({
            balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
            balanceAdjustmentTransactionId: oldAdjustment.id,
            balanceAnchorCapturedAt: initialSync.balanceAnchorCapturedAt,
            forwardSyncFromAt: initialSync.forwardSyncFromAt,
            forwardSyncedAt: initialSync.forwardSyncedAt
        });
    });
});

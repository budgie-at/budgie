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
import { expect, it, vi } from 'vitest';

import { buildMonobank, fetchSyncById, monobankStub, seedExpenseEntry, stubMonobankProviderBalance, testDb } from '../../harness';
import { fetchMonobankAdjustments } from '../../harness/db/fetch-monobank-adjustments';
import { insertOne } from '../../harness/db/insert-one';
import { setupAnchoredMonobankFixture } from '../../harness/monobank/setup-anchored-monobank-fixture';

const IMPORTED_EXPENSE_AMOUNT = 200_000;
const ANCHORED_PROVIDER_BALANCE = 500_000;
const RELEASE_ADJUSTMENT_AMOUNT = 700_000;
const INTERRUPTED_PROVIDER_BALANCE = 100;
const OLD_ADJUSTMENT_AMOUNT = 100_000;

const createFailingBalanceAuthorityTrigger = async (triggerName: string): Promise<void> => {
    await testDb.$client.runAsync(
        `CREATE TRIGGER ${triggerName}
     BEFORE UPDATE OF balance_authority ON bank_syncs
     WHEN NEW.balance_authority = 'LEDGER'
     BEGIN
         SELECT RAISE(ABORT, 'forced finalization failure');
     END`
    );
};

const setupRepeatedFailureMonobankFixture = async () => {
    const fixture = setupAnchoredMonobankFixture();
    seedExpenseEntry(fixture.account.id, IMPORTED_EXPENSE_AMOUNT, 'Imported expense');
    await syncRepository.update(fixture.sync.id, { errorCount: SYNC_ERROR_THRESHOLD });
    monobankStub.statement([]);
    monobankStub.clientInfoFailure();

    return fixture;
};

it('releases provider authority against the stored anchor when repeated failures disable the sync', async () => {
    const fixture = await setupRepeatedFailureMonobankFixture();

    await monobankSyncService.sync();

    expect(fetchSyncById(fixture.sync.id)).toMatchObject({
        enabled: false,
        balanceAuthority: SyncBalanceAuthorityEnum.LEDGER
    });
    expect(fetchMonobankAdjustments(fixture.account.id)).toStrictEqual([
        expect.objectContaining({ amount: RELEASE_ADJUSTMENT_AMOUNT, entryType: TransactionEntryTypeEnum.DEBIT })
    ]);
    expect(accountBalanceRepository.getByAccountId(fixture.account.id).get()?.balance).toBe(ANCHORED_PROVIDER_BALANCE);

    await accountBalanceIncrementalService.updateAllBalances(true);

    expect(accountBalanceRepository.getByAccountId(fixture.account.id).get()?.balance).toBe(ANCHORED_PROVIDER_BALANCE);
});

it('keeps manual disable rolled back when stored balance finalization fails', async () => {
    const fixture = setupAnchoredMonobankFixture();
    const initialSync = fetchSyncById(fixture.sync.id);
    await createFailingBalanceAuthorityTrigger('fail_manual_sync_finalization');

    await expect(monobankSyncService.setAccountSyncEnabled(fixture.account.id, false)).rejects.toThrow('forced finalization failure');

    expect(fetchSyncById(fixture.sync.id)).toMatchObject({
        enabled: true,
        balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
        balanceAdjustmentTransactionId: initialSync.balanceAdjustmentTransactionId
    });
});

it('keeps automatic disable rolled back when stored balance finalization fails', async () => {
    const fixture = await setupRepeatedFailureMonobankFixture();
    await createFailingBalanceAuthorityTrigger('fail_automatic_sync_finalization');

    await expect(monobankSyncService.sync()).rejects.toThrow('forced finalization failure');

    expect(fetchSyncById(fixture.sync.id)).toMatchObject({
        enabled: true,
        balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
        errorCount: SYNC_ERROR_THRESHOLD
    });
    expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(0);
});

it('does not finalize after the run is interrupted during the provider response', async () => {
    const fixture = setupAnchoredMonobankFixture();
    monobankStub.statement([]);
    monobankStub.clientInfo(
        buildMonobank.clientInfo({
            accounts: [buildMonobank.account({ id: fixture.externalId, balance: INTERRUPTED_PROVIDER_BALANCE })],
            jars: []
        }),
        () => {
            monobankSyncService.interruptActiveRun();
        }
    );

    await monobankSyncService.sync();

    expect(fetchSyncById(fixture.sync.id).balanceAuthority).toBe(SyncBalanceAuthorityEnum.PROVIDER);
    expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(0);
});

it('rolls back balance writes after the run is interrupted inside the balance transaction', async () => {
    const fixture = setupAnchoredMonobankFixture();
    const initialSync = fetchSyncById(fixture.sync.id);
    const initialAdjustments = fetchMonobankAdjustments(fixture.account.id);
    const [initialBalance] = await accountBalanceRepository.getByAccountIds([fixture.account.id]);
    const originalUpsert = accountBalanceRepository.upsert.bind(accountBalanceRepository);
    const upsertSpy = vi.spyOn(accountBalanceRepository, 'upsert').mockImplementation(async (balance, tx) => {
        const result = await originalUpsert(balance, tx);
        monobankSyncService.interruptActiveRun();
        upsertSpy.mockRestore();

        return result;
    });
    monobankStub.statement([]);
    stubMonobankProviderBalance(fixture.externalId, INTERRUPTED_PROVIDER_BALANCE);

    await monobankSyncService.sync().finally(() => {
        upsertSpy.mockRestore();
    });

    expect(fetchMonobankAdjustments(fixture.account.id)).toStrictEqual(initialAdjustments);
    expect(await accountBalanceRepository.getByAccountIds([fixture.account.id])).toStrictEqual([initialBalance]);
    expect(fetchSyncById(fixture.sync.id)).toMatchObject({
        balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
        balanceAdjustmentTransactionId: initialSync.balanceAdjustmentTransactionId,
        forwardSyncFromAt: initialSync.forwardSyncFromAt,
        forwardSyncedAt: initialSync.forwardSyncedAt
    });
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
        amount: OLD_ADJUSTMENT_AMOUNT,
        categoryId: null,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: OLD_ADJUSTMENT_AMOUNT,
        toIban: null,
        originalTransactionId: null
    });
    await syncRepository.update(fixture.sync.id, {
        balanceAdjustmentTransactionId: oldAdjustment.id,
        errorCount: SYNC_ERROR_THRESHOLD
    });
    const initialSync = fetchSyncById(fixture.sync.id);
    const [initialBalance] = await accountBalanceRepository.getByAccountIds([fixture.account.id]);
    await createFailingBalanceAuthorityTrigger('fail_sync_finalization');
    stubMonobankProviderBalance(fixture.externalId, INTERRUPTED_PROVIDER_BALANCE);

    await expect(monobankSyncService.sync()).rejects.toThrow('forced finalization failure');

    expect(fetchMonobankAdjustments(fixture.account.id)).toStrictEqual([
        expect.objectContaining({ id: oldAdjustment.id, amount: OLD_ADJUSTMENT_AMOUNT })
    ]);
    expect(await accountBalanceRepository.getByAccountIds([fixture.account.id])).toStrictEqual([initialBalance]);
    expect(fetchSyncById(fixture.sync.id)).toMatchObject({
        balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
        balanceAdjustmentTransactionId: oldAdjustment.id,
        forwardSyncFromAt: initialSync.forwardSyncFromAt,
        forwardSyncedAt: initialSync.forwardSyncedAt
    });
});

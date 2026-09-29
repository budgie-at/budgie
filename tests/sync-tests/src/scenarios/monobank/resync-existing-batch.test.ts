import { syncRepository } from '@app/@generic/drizzle/db/db';
import { databaseRefreshService } from '@app/@generic/service/database-refresh.service';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { transactionService } from '@app/transaction/service/transaction.service';
import { PRECISION, TransactionEntryEntityTable } from '@budgie/contracts';
import Database from 'better-sqlite3';
import { like } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

const SMALL_PAGE_SIZE = 5;
const LARGE_PAGE_SIZE = 20;

const buildRows = (count: number, amount: number) =>
    Array.from({ length: count }, (_, index) => buildMonobank.transaction({ id: `tx-resync-${index}`, amount, hold: false }));

const resyncAndMeasure = async (accountId: number, count: number, amount: number) => {
    await syncRepository.resetForWindowedResync(accountId, new Date(2026, 0, 1));
    monobankStub.statementBatches([buildRows(count, amount)]);
    const bulkUpdateSpy = vi.spyOn(transactionService, 'bulkUpdateImported');
    const statementSpy = vi.spyOn(Database.prototype, 'prepare');
    let invalidationCount = 0;
    const unsubscribe = databaseRefreshService.subscribe(() => {
        invalidationCount += 1;
    });

    await monobankSyncService.sync();
    unsubscribe();
    const statements = statementSpy.mock.calls.map(([sqlText]) => sqlText);
    const bulkUpdateCallCount = bulkUpdateSpy.mock.calls.length;
    statementSpy.mockRestore();
    bulkUpdateSpy.mockRestore();

    return {
        bulkUpdateCallCount,
        invalidationCount,
        statementCount: statements.length,
        transactionCount: statements.filter(sqlText => sqlText.startsWith('SAVEPOINT')).length
    };
};

describe('monobank/resync-existing-batch', () => {
    it('resyncs a page of existing rows in one transaction and one invalidation without per-row lookups', async () => {
        const { account } = setupMonobankFixture();
        monobankStub.statementBatches([buildRows(LARGE_PAGE_SIZE, -1000)]);
        await monobankSyncService.sync();

        const small = await resyncAndMeasure(account.id, SMALL_PAGE_SIZE, -2000);
        const large = await resyncAndMeasure(account.id, LARGE_PAGE_SIZE, -3000);
        const entries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(like(TransactionEntryEntityTable.externalId, 'tx-resync-%'))
            .all();

        expect(small.bulkUpdateCallCount).toBe(1);
        expect(large.bulkUpdateCallCount).toBe(1);
        expect(small.invalidationCount).toBe(1);
        expect(large.invalidationCount).toBe(1);
        expect(large.transactionCount).toBe(small.transactionCount);
        expect(large.statementCount - small.statementCount).toBeLessThanOrEqual(2 * (LARGE_PAGE_SIZE - SMALL_PAGE_SIZE));
        expect(entries).toHaveLength(LARGE_PAGE_SIZE);
        expect(entries.every(entry => entry.amount === 30 * PRECISION)).toBe(true);
    });
});

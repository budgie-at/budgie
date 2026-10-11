import { DatabaseSync } from 'node:sqlite';

import { Db, PRECISION, SyncRepository, TransactionEntryEntityTable } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { describe, expect, it, vi } from '@effect/vitest';
import { like } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, MonobankSyncService, setupMonobankFixture, testDb, TestLayer } from '../../harness';

const SMALL_PAGE_SIZE = 5;
const LARGE_PAGE_SIZE = 20;

const buildRows = (count: number, amount: number) =>
    Array.from({ length: count }, (_, index) => buildMonobank.transaction({ id: `tx-resync-${index}`, amount, hold: false }));

const resyncAndMeasure = Effect.fnUntraced(function* (accountId: number, count: number, amount: number) {
    const syncRepository = yield* SyncRepository;
    const monobankSyncService = yield* MonobankSyncService;
    const transactionService = yield* TransactionService;

    yield* syncRepository.resetForWindowedResync(accountId, new Date(2026, 0, 1));
    monobankStub.statementBatches([buildRows(count, amount)]);
    const bulkUpdateSpy = vi.spyOn(transactionService, 'bulkUpdateImported');
    let topLevelTransactionCount = 0;
    const statementSpy = vi.spyOn(DatabaseSync.prototype, 'prepare');

    yield* monobankSyncService.sync().pipe(
        Effect.provideService(Db.TransactionBoundary, transaction =>
            Effect.ensuring(
                transaction,
                Effect.sync(() => {
                    topLevelTransactionCount += 1;
                })
            )
        )
    );
    const statements = statementSpy.mock.calls.map(([sqlText]) => sqlText);
    const bulkUpdateCallCount = bulkUpdateSpy.mock.calls.length;
    statementSpy.mockRestore();
    bulkUpdateSpy.mockRestore();

    return {
        bulkUpdateCallCount,
        topLevelTransactionCount,
        statementCount: statements.length,
        transactionCount: statements.filter(sqlText => sqlText.startsWith('SAVEPOINT')).length
    };
});

describe('monobank/resync-existing-batch', () => {
    it.effect('resyncs a page of existing rows in one page, balance and installment scan transaction without per-row lookups', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const { account } = yield* setupMonobankFixture();
            monobankStub.statementBatches([buildRows(LARGE_PAGE_SIZE, -1000)]);
            yield* monobankSyncService.sync();

            const small = yield* resyncAndMeasure(account.id, SMALL_PAGE_SIZE, -2000);
            const large = yield* resyncAndMeasure(account.id, LARGE_PAGE_SIZE, -3000);
            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(like(TransactionEntryEntityTable.externalId, 'tx-resync-%'));

            expect(small.bulkUpdateCallCount).toBe(1);
            expect(large.bulkUpdateCallCount).toBe(1);
            expect(small.topLevelTransactionCount).toBe(3);
            expect(large.topLevelTransactionCount).toBe(3);
            expect(large.transactionCount).toBe(small.transactionCount);
            expect(large.statementCount - small.statementCount).toBeLessThanOrEqual(2 * (LARGE_PAGE_SIZE - SMALL_PAGE_SIZE));
            expect(entries).toHaveLength(LARGE_PAGE_SIZE);
            expect(entries.every(entry => entry.amount === 30 * PRECISION)).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );
});

import { SyncRepository, TransactionEntityTable } from '@budgie/contracts';
import { AccountArchiveService, TransactionService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, MonobankSyncService, setupMonobankFixture, testDb, TestLayer } from '../../harness';

const EXTERNAL_ID = 'tx-deleted';
const DAY_MS = 24 * 60 * 60 * 1000;

const fetchRows = () => testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, EXTERNAL_ID));

const expectOnlyTombstone = Effect.map(Effect.suspend(fetchRows), rows => {
    expect(rows).toHaveLength(1);
    expect(rows[0].deletedAt).not.toBeNull();
});

const syncThenDelete = Effect.gen(function* () {
    const monobankSyncService = yield* MonobankSyncService;
    const transactionService = yield* TransactionService;
    const { account } = yield* setupMonobankFixture();
    const payload = buildMonobank.transaction({ id: EXTERNAL_ID, amount: -2500, hold: false });

    monobankStub.statement([payload]);
    yield* monobankSyncService.sync();
    const [transaction] = yield* fetchRows();
    yield* transactionService.deleteById(transaction.id);

    return { account, payload };
});

describe('monobank/deleted-transaction-resync', () => {
    it.effect('keeps a deleted synced transaction deleted when a re-sync returns it again', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const syncRepository = yield* SyncRepository;
            const { account, payload } = yield* syncThenDelete;

            yield* syncRepository.resetForWindowedResync(account.id, new Date(2026, 0, 1));
            monobankStub.statementBatches([[payload]]);
            yield* monobankSyncService.sync();

            yield* expectOnlyTombstone;
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a transaction deleted a day earlier deleted after its account is archived and restored', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const { account } = yield* syncThenDelete;
            yield* testDb
                .update(TransactionEntityTable)
                .set({ deletedAt: new Date(Date.now() - DAY_MS) })
                .where(eq(TransactionEntityTable.externalId, EXTERNAL_ID));

            yield* accountArchiveService.archiveById(account.id);
            yield* accountArchiveService.restoreById(account.id);

            yield* expectOnlyTombstone;
        }).pipe(Effect.provide(TestLayer))
    );
});

import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/unchanged-data-noop', () => {
    it.effect('re-sync of identical data does not touch updatedAt on transactions or entries', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const { sync } = setupMonobankFixture();

            const txPayload = buildMonobank.transaction({ id: 'tx-stable', amount: -2500, hold: false });
            monobankStub.statement([txPayload]);
            yield* monobankSyncService.sync();

            const txAfterFirst = testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalId, 'tx-stable'))
                .all()[0];
            const entryAfterFirst = testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-stable'))
                .all()[0];

            testDb
                .update(SyncEntityTable)
                .set({ forwardSyncFromAt: new Date(2026, 0, 1) })
                .where(eq(SyncEntityTable.id, sync.id))
                .run();

            monobankStub.statement([txPayload]);
            yield* monobankSyncService.sync();

            const txAfterSecond = testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalId, 'tx-stable'))
                .all()[0];
            const entryAfterSecond = testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-stable'))
                .all()[0];

            expect(txAfterSecond.updatedAt?.getTime()).toBe(txAfterFirst.updatedAt?.getTime());
            expect(entryAfterSecond.updatedAt?.getTime()).toBe(entryAfterFirst.updatedAt?.getTime());

            const allRows = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-stable')).all();
            expect(allRows).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});

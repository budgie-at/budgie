import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { MccCategoryEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/mcc-mapping', () => {
    it.effect('resolves the MCC code to the matching mcc_categories row id on insert', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const groceryRow = testDb.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, '5411')).all()[0];
            expect(groceryRow).toBeDefined();

            setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({ id: 'tx-grocery', amount: -2500, hold: false, mcc: 5411, originalMcc: 5411 })
            ]);

            yield* monobankSyncService.sync();

            const entry = testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-grocery'))
                .all()[0];
            expect(entry.mccCategoryId).toBe(groceryRow.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves mccCategoryId null when the MCC is unknown', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({ id: 'tx-unknown-mcc', amount: -2500, hold: false, mcc: 99999, originalMcc: 99999 })
            ]);

            yield* monobankSyncService.sync();

            const entry = testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-unknown-mcc'))
                .all()[0];
            expect(entry.mccCategoryId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});

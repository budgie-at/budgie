import { TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, findMccByCode, monobankStub, MonobankSyncService, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/mcc-mapping', () => {
    it.effect('resolves the MCC code to the matching mcc_categories row id on insert', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const groceryRow = yield* findMccByCode('5411');

            yield* setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({ id: 'tx-grocery', amount: -2500, hold: false, mcc: 5411, originalMcc: 5411 })
            ]);

            yield* monobankSyncService.sync();

            const entry = (yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-grocery')))[0];
            expect(entry.mccCategoryId).toBe(groceryRow.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves mccCategoryId null when the MCC is unknown', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            yield* setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({ id: 'tx-unknown-mcc', amount: -2500, hold: false, mcc: 99999, originalMcc: 99999 })
            ]);

            yield* monobankSyncService.sync();

            const entry = (yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-unknown-mcc')))[0];
            expect(entry.mccCategoryId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});

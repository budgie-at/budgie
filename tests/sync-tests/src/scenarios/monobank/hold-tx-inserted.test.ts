import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { TransactionEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/hold-tx-inserted', () => {
    it.effect('inserts a held transaction (regression: !hold filter must not drop it)', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;

            yield* setupMonobankFixture();
            monobankStub.statement([buildMonobank.transaction({ id: 'tx-hold-1', amount: -2500, hold: true })]);

            yield* monobankSyncService.sync();

            const rows = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-hold-1'));
            expect(rows).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});

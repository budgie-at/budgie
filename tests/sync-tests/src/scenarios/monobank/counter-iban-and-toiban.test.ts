import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/counter-iban-and-toiban', () => {
    it.effect('persists counterIban from the API into transaction_entries.toIban', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const counterIban = 'UA213223130000026007233566001';

            setupMonobankFixture();
            monobankStub.statement([buildMonobank.transaction({ id: 'tx-with-iban', amount: -100000, hold: false, counterIban })]);

            yield* monobankSyncService.sync();

            const entry = testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-with-iban'))
                .all()[0];
            expect(entry.toIban).toBe(counterIban);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves toIban null when monobank omits counterIban', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            setupMonobankFixture();
            monobankStub.statement([buildMonobank.transaction({ id: 'tx-no-iban', amount: -100000, hold: false })]);

            yield* monobankSyncService.sync();

            const entry = testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-no-iban'))
                .all()[0];
            expect(entry.toIban).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});

import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/cross-currency-exchange-rate', () => {
    it.effect('computes exchangeRate as amount/operationAmount when currencies differ', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({
                    id: 'tx-fx',
                    amount: -410000,
                    operationAmount: -10000,
                    hold: false,
                    currencyCode: 840
                })
            ]);

            yield* monobankSyncService.sync();

            const transaction = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-fx')).all()[0];
            const entry = testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-fx'))
                .all()[0];

            expect(transaction.exchangeRate).toBe(41);
            expect(entry.exchangeRate).toBe(41);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps exchangeRate=1 when amount equals operationAmount', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({ id: 'tx-same-currency', amount: -10000, operationAmount: -10000, hold: false })
            ]);

            yield* monobankSyncService.sync();

            const transaction = testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalId, 'tx-same-currency'))
                .all()[0];
            expect(transaction.exchangeRate).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );
});

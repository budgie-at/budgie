import { TransactionEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildMonobank,
    fetchExpenseEntries,
    monobankStub,
    MonobankSyncService,
    setupMonobankFixture,
    testDb,
    TestLayer
} from '../../harness';

describe('monobank/cross-currency-exchange-rate', () => {
    it.effect('computes exchangeRate as amount/operationAmount when currencies differ', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            yield* setupMonobankFixture();
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

            const transaction = (yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalId, 'tx-fx')))[0];
            const [entry] = yield* fetchExpenseEntries(transaction.id);

            expect(transaction.exchangeRate).toBe(41);
            expect(entry.exchangeRate).toBe(41);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps exchangeRate=1 when amount equals operationAmount', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            yield* setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({ id: 'tx-same-currency', amount: -10000, operationAmount: -10000, hold: false })
            ]);

            yield* monobankSyncService.sync();

            const transaction = (yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.externalId, 'tx-same-currency')))[0];
            expect(transaction.exchangeRate).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );
});

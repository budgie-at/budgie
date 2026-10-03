import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/refund-pair-partial', it => {
    it.effect('moves the partial refund debit entry onto the expense canonical', () =>
        Effect.gen(function* () {
            const { consolidated, expense, refunds } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [40 * PRECISION]
            });

            expect(consolidated).toBe(1);
            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.REFUND
            );

            const promotedEntries = yield* testQueryService.fetchEntriesByTransactionId(expense.id);

            expect(promotedEntries).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ amount: 120 * PRECISION, type: TransactionEntryTypeEnum.CREDIT }),
                    expect.objectContaining({
                        amount: 40 * PRECISION,
                        originalTransactionId: refunds[0].id,
                        type: TransactionEntryTypeEnum.DEBIT
                    })
                ])
            );
        })
    );
});

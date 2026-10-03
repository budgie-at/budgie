import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectRefundCanonicalTags } from '../harness/expect-refund-canonical-tags';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/refund-pair-full-refund', it => {
    it.effect('promotes the expense and keeps a full refund neutral on the canonical ledger', () =>
        Effect.gen(function* () {
            const { consolidated, expense, refunds } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [120 * PRECISION]
            });

            expect(consolidated).toBe(1);

            const promotedExpense = yield* testQueryService.fetchTransactionById(expense.id);
            expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
            expect((yield* testQueryService.fetchTransactionById(refunds[0].id)).consolidationParentTransactionId).toBe(expense.id);

            const expenseEntries = yield* testQueryService.fetchEntriesByTransactionId(expense.id);
            const creditTotal = expenseEntries
                .filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT)
                .reduce((sum, entry) => sum + entry.amount, 0);
            const debitTotal = expenseEntries
                .filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
                .reduce((sum, entry) => sum + entry.amount, 0);

            expect(creditTotal - debitTotal).toBe(0);
        })
    );

    it.effect('copies refund income tags to the expense canonical', () =>
        Effect.gen(function* () {
            const tag = yield* testSeedService.tag('Refund Source');
            const { consolidated, expense } = yield* runRefundScenario({
                beforeConsolidation: ({ refunds }) => testSeedService.transactionTag(refunds[0].id, tag.id),
                expenseAmount: 120 * PRECISION,
                refundAmounts: [120 * PRECISION]
            });

            expect(consolidated).toBe(1);
            yield* expectRefundCanonicalTags(expense.id, [tag.id]);
        })
    );
});

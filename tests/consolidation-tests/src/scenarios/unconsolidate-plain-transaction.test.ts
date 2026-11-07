import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/unconsolidate-plain-transaction', it => {
    it.effect('leaves a transaction that is not a consolidation canonical untouched', () =>
        Effect.gen(function* () {
            const account = yield* testSeedService.account();
            const tag = yield* testSeedService.tag('Groceries');
            const expense = yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: 75 * PRECISION,
                operatedAt: new Date('2026-05-10T10:00:00.000Z'),
                title: 'Corner shop'
            });

            yield* testSeedService.transactionTag(expense.id, tag.id);

            const entriesBefore = yield* testQueryService.fetchEntriesByTransactionId(expense.id);
            const balancesBefore = yield* fetchLedgerBalances([account.id]);

            yield* unconsolidateById(expense.id);

            expect((yield* testQueryService.fetchTransactionById(expense.id)).deletedAt).toBeNull();
            expect(yield* testQueryService.fetchEntriesByTransactionId(expense.id)).toEqual(entriesBefore);
            expect(yield* testQueryService.fetchTransactionTagIds(expense.id)).toEqual([tag.id]);
            expect(yield* fetchLedgerBalances([account.id])).toEqual(balancesBefore);
        })
    );

    it.effect('still separates a refund consolidation', () =>
        Effect.gen(function* () {
            const { expense, refunds } = yield* runRefundScenario({ expenseAmount: 90 * PRECISION, refundAmounts: [30 * PRECISION] });

            expect((yield* testQueryService.fetchTransactionById(expense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.REFUND
            );

            yield* unconsolidateById(expense.id);

            const [separatedExpense, separatedRefund] = yield* Effect.all([
                testQueryService.fetchTransactionById(expense.id),
                testQueryService.fetchTransactionById(refunds[0].id)
            ]);

            expect(separatedExpense.consolidationType).toBeNull();
            expect(separatedRefund.consolidationParentTransactionId).toBeNull();
        })
    );
});

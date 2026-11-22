import { RefundConsolidationService, RefundPairRepository } from '@budgie/consolidation';
import { convertToMicroUnits } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectRefundOutcome } from '../harness/expect-refund-outcome';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer, unconsolidateById } from '../harness/test-context';

const UNPAIR_TITLE = 'Zara';
const UNPAIR_AMOUNT = convertToMicroUnits(1_299);

const seedConsolidatedRefund = Effect.gen(function* () {
    const account = yield* testSeedService.account({ externalId: 'mono-card' });
    const { expense, refunds } = yield* testSeedService.refundedExpense({
        accountId: account.id,
        title: UNPAIR_TITLE,
        expenseAmount: UNPAIR_AMOUNT,
        refundAmounts: [UNPAIR_AMOUNT],
        externalIdPrefix: 'unpair'
    });

    expect((yield* runConsolidation()).consolidated).toBe(1);

    return { expense, refund: refunds[0] };
});

const fetchRefundState = (refundId: number) =>
    Effect.map(testQueryService.fetchTransactionById(refundId), refund => ({
        isAutoPairDisabled: refund.refundAutoPairDisabled,
        parentId: refund.consolidationParentTransactionId
    }));

layer(TestLayer)('consolidation/refund-pair-user-unpair', it => {
    it.effect('keeps a refund the user unpaired out of automatic pairing through manual conversion and system detaches', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const refundConsolidationService = yield* RefundConsolidationService;
            const refundPairRepository = yield* RefundPairRepository;
            const { expense, refund } = yield* seedConsolidatedRefund;

            yield* transactionService.revertConsolidationByUser(expense.id);

            expect(yield* fetchRefundState(refund.id)).toEqual({ isAutoPairDisabled: true, parentId: null });
            expect((yield* runConsolidation()).consolidated).toBe(0);
            expect(yield* refundPairRepository.findReviewCandidates()).toEqual([
                expect.objectContaining({ expenseTransactionId: expense.id, refundIncomeTransactionIds: [refund.id] })
            ]);

            yield* refundConsolidationService.convertToRefund({ expenseTransactionId: expense.id, refundIncomeTransactionId: refund.id });
            yield* expectRefundOutcome(expense.id, [refund.id], [expense.id]);
            expect((yield* fetchRefundState(refund.id)).isAutoPairDisabled).toBe(true);

            yield* unconsolidateById(expense.id);

            expect((yield* runConsolidation()).consolidated).toBe(0);
            expect(yield* fetchRefundState(refund.id)).toEqual({ isAutoPairDisabled: true, parentId: null });
        })
    );

    it.effect('leaves the marker off when the system unconsolidates a refund so the next run pairs it again', () =>
        Effect.gen(function* () {
            const { expense, refund } = yield* seedConsolidatedRefund;

            yield* unconsolidateById(expense.id);

            expect(yield* fetchRefundState(refund.id)).toEqual({ isAutoPairDisabled: false, parentId: null });
            expect((yield* runConsolidation()).consolidated).toBe(1);
            yield* expectRefundOutcome(expense.id, [refund.id], [expense.id]);
        })
    );
});

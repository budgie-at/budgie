import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

const SHARED_EXPENSE_AMOUNT = 100 * PRECISION;
const SHARED_TITLE = 'SHARED MERCHANT #42';

describe('consolidation/refund-pair-shared-expense', () => {
    it('auto-consolidates the best-ranked refund and routes the overflow refund to review instead of dropping the group', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: SHARED_EXPENSE_AMOUNT,
            refundAmounts: [SHARED_EXPENSE_AMOUNT, SHARED_EXPENSE_AMOUNT],
            title: SHARED_TITLE
        });

        const [winner, loser] = refunds;

        const autoCandidates = await refundPairRepository.findCandidates();
        const reviewCandidates = await refundPairRepository.findReviewCandidates();

        expect(autoCandidates).toEqual([
            {
                confidenceBucket: 'AUTO_REFUND_EXACT_TITLE',
                matchType: 'exact-title',
                accountId: account.id,
                expenseTransactionId: expense.id,
                expenseEntryAmount: SHARED_EXPENSE_AMOUNT,
                refundIncomeTransactionIds: [winner.id],
                refundsTotal: SHARED_EXPENSE_AMOUNT
            }
        ]);
        expect(reviewCandidates).toEqual([
            {
                confidenceBucket: 'AUTO_REFUND_EXACT_TITLE',
                matchType: 'exact-title',
                accountId: account.id,
                expenseTransactionId: expense.id,
                expenseEntryAmount: SHARED_EXPENSE_AMOUNT,
                refundIncomeTransactionIds: [loser.id],
                refundsTotal: SHARED_EXPENSE_AMOUNT
            }
        ]);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(winner.id).consolidationParentTransactionId).toBe(expense.id);
        expect(testQueryService.fetchTransactionById(loser.id).consolidationParentTransactionId).toBeNull();
    });
});

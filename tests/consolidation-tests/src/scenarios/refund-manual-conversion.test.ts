import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { refundConsolidationService, testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/refund-manual-conversion', () => {
    it('manually converts when the income and expense already share a tag', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });
        const tag = testSeedService.tag('Shared');

        testSeedService.transactionTag(expense.id, tag.id);
        testSeedService.transactionTag(refunds[0].id, tag.id);

        const canonicalTransactionId = await refundConsolidationService.convertToRefund({
            refundIncomeTransactionId: refunds[0].id,
            expenseTransactionId: expense.id
        });

        expect(canonicalTransactionId).toBe(expense.id);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionTagIds(expense.id)).toHaveLength(1);
    });

    it('finds refundable expenses only from refund income transactions', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION],
            title: 'Apple Store',
            refundTitle: 'Apple Store refund'
        });

        const incomeCandidates = await refundConsolidationService.findRefundableExpenses(refunds[0].id, '');
        const expenseCandidates = await refundConsolidationService.findRefundableExpenses(expense.id, '');

        expect(incomeCandidates).toMatchObject([{ id: expense.id }]);
        expect(expenseCandidates).toEqual([]);
    });
});

import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { refundConsolidationService, testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/refund-manual-conversion', () => {
    it('manually converts when the income and expense already share a tag', async () => {
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: testSeedService.account({ externalId: 'mono-card' }).id,
            expenseAmount: convertToMicroUnits(120),
            refundAmounts: [convertToMicroUnits(40)]
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
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: testSeedService.account({ externalId: 'mono-card' }).id,
            expenseAmount: convertToMicroUnits(120),
            externalIdPrefix: 'manual-refund',
            refundAmounts: [convertToMicroUnits(40)],
            refundTitle: 'Apple Store refund',
            title: 'Apple Store'
        });

        const incomeCandidates = await refundConsolidationService.findRefundableExpenses(refunds[0].id, '');
        const expenseCandidates = await refundConsolidationService.findRefundableExpenses(expense.id, '');

        expect(incomeCandidates).toMatchObject([{ id: expense.id }]);
        expect(expenseCandidates).toEqual([]);
    });

    it('rejects a sequential refund that exceeds the remaining expense amount', async () => {
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: testSeedService.account({ externalId: 'mono-card' }).id,
            expenseAmount: convertToMicroUnits(120),
            refundAmounts: [convertToMicroUnits(80), convertToMicroUnits(50)]
        });

        await refundConsolidationService.convertToRefund({
            refundIncomeTransactionId: refunds[0].id,
            expenseTransactionId: expense.id
        });

        await expect(
            refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: refunds[1].id,
                expenseTransactionId: expense.id
            })
        ).rejects.toThrowError('Refund amount cannot exceed the expense');

        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
        expect(testQueryService.fetchTransactionById(refunds[1].id).consolidationParentTransactionId).toBeNull();
        expect(
            testQueryService
                .fetchEntriesByTransactionId(expense.id)
                .filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
                .map(entry => entry.amount)
        ).toEqual([convertToMicroUnits(80)]);
    });
});

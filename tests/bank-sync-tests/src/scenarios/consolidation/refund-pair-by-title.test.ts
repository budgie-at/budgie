import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchTransactionById, runRefundScenario, seed, seedRefundedExpense } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-by-title', () => {
    it('promotes the original expense in place when title matches exactly within 30 days', async () => {
        const { expense, refunds, result } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });

        expect(result.consolidated).toBe(1);

        const reparentedRefund = fetchTransactionById(refunds[0].id);
        expect(reparentedRefund.consolidationParentTransactionId).toBe(expense.id);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(promotedExpense.consolidationParentTransactionId).toBeNull();
    });

    it('does NOT consolidate when titles differ', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            title: 'STARBUCKS #1234',
            refundTitle: 'WALMART #5678'
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });

    it('does NOT auto-consolidate one refund when multiple same-title expenses can claim it', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [],
            externalIdPrefix: 'first',
            expenseOperatedAt: new Date(2026, 0, 15, 12, 0, 0)
        });
        seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            externalIdPrefix: 'second',
            expenseOperatedAt: new Date(2026, 0, 16, 12, 0, 0)
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });

    it('auto-consolidates cancellation-prefixed card reversals to the nearest same-amount expense', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const amount = 3_963_900_000;
        const first = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: amount,
            refundAmounts: [amount],
            title: 'OBB',
            refundTitle: 'Скасування. OBB',
            expenseOperatedAt: new Date(2024, 11, 10, 19, 40, 59),
            refundDelaySeconds: 68,
            externalIdPrefix: 'obb-first'
        });
        const second = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: amount,
            refundAmounts: [amount],
            title: 'OBB',
            refundTitle: 'Скасування. OBB',
            expenseOperatedAt: new Date(2024, 11, 10, 19, 43, 29),
            refundDelaySeconds: 71,
            externalIdPrefix: 'obb-second'
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(2);
        expect(fetchTransactionById(first.expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(fetchTransactionById(first.refunds[0].id).consolidationParentTransactionId).toBe(first.expense.id);
        expect(fetchTransactionById(second.expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(fetchTransactionById(second.refunds[0].id).consolidationParentTransactionId).toBe(second.expense.id);
    });
});

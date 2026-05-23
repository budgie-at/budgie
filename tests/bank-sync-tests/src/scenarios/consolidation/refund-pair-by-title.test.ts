import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchTransactionById, runRefundScenario, seed, seedRefundedExpense } from '../../harness';

import { refundPairRepository } from '@app/@generic/drizzle/db/db';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-by-title', () => {
    it.each([
        {
            name: 'title matches exactly within 30 days',
            scenario: { expenseAmount: 120 * PRECISION, refundAmounts: [120 * PRECISION] },
            checksParent: true
        },
        {
            name: 'a localized cancellation prefix leaves the same title',
            scenario: {
                expenseAmount: 898 * PRECISION,
                refundAmounts: [898 * PRECISION],
                title: 'Lime',
                refundTitle: 'Скасування. Lime'
            },
            checksParent: false
        }
    ])('promotes the original expense when $name', async ({ scenario, checksParent }) => {
        const { expense, refunds, result } = await runRefundScenario(scenario);

        expect(result.consolidated).toBe(1);

        const reparentedRefund = fetchTransactionById(refunds[0].id);
        expect(reparentedRefund.consolidationParentTransactionId).toBe(expense.id);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        if (checksParent) {
            expect(promotedExpense.consolidationParentTransactionId).toBeNull();
        }
    });

    it('ranks a localized cancellation prefix as a single automatic refund candidate', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 898 * PRECISION,
            refundAmounts: [898 * PRECISION],
            title: 'Lime',
            refundTitle: 'Скасування. Lime'
        });

        const candidates = await refundPairRepository.findCandidates();

        expect(candidates).toEqual([
            {
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_CANCELLATION_TITLE',
                matchType: 'localized-cancellation-title',
                accountId: account.id,
                expenseTransactionId: expense.id,
                expenseEntryAmount: 898 * PRECISION,
                refundIncomeTransactionIds: [refunds[0].id],
                refundsTotal: 898 * PRECISION
            }
        ]);
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
});

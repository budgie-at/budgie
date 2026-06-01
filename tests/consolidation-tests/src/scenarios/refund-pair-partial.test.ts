import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService } from '../harness/test-context';

describe('consolidation/refund-pair-partial', () => {
    it('moves the partial refund debit entry onto the expense canonical', async () => {
        const { consolidated, expense, refunds } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        expect(consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        const promotedEntries = testQueryService.fetchEntriesByTransactionId(expense.id);

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
    });
});

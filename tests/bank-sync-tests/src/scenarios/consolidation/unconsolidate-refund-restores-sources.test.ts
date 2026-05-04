import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, transactionAsync } from '@budgie/contracts';

import { fetchTransactionById, runRefundScenario } from '../../harness';

import { db } from '@app/@generic/drizzle/db/db';
import { unconsolidateByIdInTransaction } from '@app/transaction/utils/unconsolidate-by-id-in-transaction.util';

describe('consolidation/unconsolidate-refund-restores-sources', () => {
    it('restores the refund as a standalone INCOME and clears consolidationType on the expense', async () => {
        const { expense, refunds } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        expect(fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        await transactionAsync(db, async tx => unconsolidateByIdInTransaction(expense.id, tx));

        const restoredExpense = fetchTransactionById(expense.id);
        expect(restoredExpense.consolidationType).toBeNull();

        const restoredRefund = fetchTransactionById(refunds[0].id);
        expect(restoredRefund.consolidationParentTransactionId).toBeNull();
    });
});

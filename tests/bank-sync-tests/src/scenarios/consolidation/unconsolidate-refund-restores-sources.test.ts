import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchTransactionById, seed, seedRefundedExpense } from '../../harness';

import { unconsolidateByIdInTransaction } from '@app/transaction/utils/unconsolidate-by-id-in-transaction.util';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { db } from '@app/@generic/drizzle/db/db';
import { transactionAsync } from '@budgie/contracts';

describe('consolidation/unconsolidate-refund-restores-sources', () => {
    it('restores the refund as a standalone INCOME and clears consolidationType on the expense', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        await transferConsolidationService.consolidate();
        expect(fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        await transactionAsync(db, async tx => unconsolidateByIdInTransaction(expense.id, tx));

        const restoredExpense = fetchTransactionById(expense.id);
        expect(restoredExpense.consolidationType).toBeNull();

        const restoredRefund = fetchTransactionById(refunds[0].id);
        expect(restoredRefund.consolidationParentTransactionId).toBeNull();
    });
});

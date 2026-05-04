import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { fetchTransactionById, seed, seedRefundedExpense, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-full-refund', () => {
    it('promotes the expense and reparents the matching-amount refund (full refund)', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);

        const expenseEntries = await testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, expense.id));

        const credits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
        const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
        const creditTotal = credits.reduce((sum, entry) => sum + entry.amount, 0);
        const debitTotal = debits.reduce((sum, entry) => sum + entry.amount, 0);

        expect(creditTotal - debitTotal).toBe(0);
    });
});

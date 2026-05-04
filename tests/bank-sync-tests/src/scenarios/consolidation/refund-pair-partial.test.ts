import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { fetchTransactionById, seed, seedRefundedExpense, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-partial', () => {
    it('moves the partial refund DEBIT entry onto the expense canonical', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        const expenseEntries = await testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, expense.id));

        const credits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
        const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

        expect(credits).toHaveLength(1);
        expect(credits[0].amount).toBe(120 * PRECISION);
        expect(debits).toHaveLength(1);
        expect(debits[0].amount).toBe(40 * PRECISION);
        expect(debits[0].originalTransactionId).toBe(refunds[0].id);
    });
});

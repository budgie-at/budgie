import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';

import { fetchTransactionById, seed, seedRefundedExpense, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-multiple-refunds', () => {
    it('reparents N refund incomes under one expense canonical (1:N)', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION, 30 * PRECISION]
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        for (const refund of refunds) {
            expect(fetchTransactionById(refund.id).consolidationParentTransactionId).toBe(expense.id);
        }

        const expenseEntries = await testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, expense.id));

        const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
        expect(debits).toHaveLength(2);
        expect(debits.map(entry => entry.amount).sort((a, b) => a - b)).toEqual([30 * PRECISION, 40 * PRECISION]);
    });
});

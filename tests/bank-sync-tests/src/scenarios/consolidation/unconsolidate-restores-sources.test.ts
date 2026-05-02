import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { TransactionConsolidationTypeEnum, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, seedTransferPairFixture, setupScenario, testDb } from '../../harness';

import { transactionService } from '@app/transaction/service/transaction.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

setupScenario();

describe('consolidation/unconsolidate-restores-sources', () => {
    it('unconsolidateById deletes the canonical and restores source transactions to their original ledger entries', async () => {
        const { expense, income } = seedTransferPairFixture();

        await transferConsolidationService.consolidate();

        const canonical = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)[0];
        expect(canonical).toBeDefined();

        await transactionService.unconsolidateById(canonical.id);

        const canonicalAfter = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, canonical.id)).all();
        expect(canonicalAfter).toHaveLength(0);

        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();
        expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBeNull();

        const expenseEntry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-expense'))
            .all()[0];
        const incomeEntry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-income'))
            .all()[0];
        expect(expenseEntry.transactionId).toBe(expense.id);
        expect(expenseEntry.originalTransactionId).toBeNull();
        expect(incomeEntry.transactionId).toBe(income.id);
        expect(incomeEntry.originalTransactionId).toBeNull();

        const leftover = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonical.id))
            .all();
        expect(leftover).toHaveLength(0);

        // Re-running consolidate after unconsolidate finds the pair again
        const reResult = await transferConsolidationService.consolidate();
        expect(reResult.consolidated).toBe(1);

        const canonicalsAfterRerun = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicalsAfterRerun.filter(row => row.deletedAt === null)).toHaveLength(1);
    });
});

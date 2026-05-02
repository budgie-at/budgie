import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { TransactionConsolidationTypeEnum, TransactionEntryEntityTable, TransactionTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, seedTransferPairFixture, setupScenario, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

setupScenario();

describe('consolidation/transfer-pair-by-iban', () => {
    it('promotes EXPENSE+INCOME with matching counterIban into a canonical TRANSFER', async () => {
        const { fromAccount, toAccount, expense, income } = seedTransferPairFixture();

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);
        expect(result.found).toBe(1);

        const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(canonicals[0].fromAccountId).toBe(fromAccount.id);
        expect(canonicals[0].toAccountId).toBe(toAccount.id);

        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonicals[0].id);

        const movedEntries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonicals[0].id))
            .all();
        const shadowEntries = movedEntries.filter(entry => entry.originalTransactionId !== null);
        expect(shadowEntries).toHaveLength(2);
        expect(shadowEntries.map(entry => entry.originalTransactionId).sort()).toEqual([expense.id, income.id].sort());
    });
});

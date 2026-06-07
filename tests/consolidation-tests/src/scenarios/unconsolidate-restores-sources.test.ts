import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService, unconsolidationService } from '../harness/test-context';

describe('consolidation/unconsolidate-restores-sources', () => {
    it('deletes the canonical transfer and restores source ledger entries', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { expense, income } = testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        const result = await runConsolidation();
        expect(result.consolidated).toBe(1);

        const canonical = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)[0];
        expect(canonical).toBeDefined();

        await unconsolidationService.unconsolidateById(canonical.id, testDb);

        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(income.id).consolidationParentTransactionId).toBeNull();

        const expenseEntry = testQueryService.fetchEntryByExternalId('tx-expense');
        const incomeEntry = testQueryService.fetchEntryByExternalId('tx-income');
        expect(expenseEntry.transactionId).toBe(expense.id);
        expect(expenseEntry.originalTransactionId).toBeNull();
        expect(incomeEntry.transactionId).toBe(income.id);
        expect(incomeEntry.originalTransactionId).toBeNull();

        const secondResult = await runConsolidation();
        expect(secondResult.consolidated).toBe(1);
    });
});

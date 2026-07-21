import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/scoped-consolidation', () => {
    it('only consolidates candidates touching scoped transaction ids inside the same operated-at window', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        const { fromAccount, toAccount } = testSeedService.accountPair();
        const scopedExpense = testSeedService.bankPairExpense(
            { externalId: 'scoped-expense', operatedAt },
            { accountId: fromAccount.id, amount: 100 * PRECISION, mccCategoryId: transferMcc.id }
        );
        const scopedIncome = testSeedService.bankPairIncome(
            { externalId: 'scoped-income', operatedAt: new Date(operatedAt.getTime() + 5_000) },
            { accountId: toAccount.id, amount: 100 * PRECISION, mccCategoryId: transferMcc.id }
        );
        const unrelatedExpense = testSeedService.bankPairExpense(
            { externalId: 'unrelated-expense', operatedAt },
            { accountId: fromAccount.id, amount: 200 * PRECISION, mccCategoryId: transferMcc.id }
        );
        const unrelatedIncome = testSeedService.bankPairIncome(
            { externalId: 'unrelated-income', operatedAt: new Date(operatedAt.getTime() + 5_000) },
            { accountId: toAccount.id, amount: 200 * PRECISION, mccCategoryId: transferMcc.id }
        );

        const result = await runConsolidation({
            operatedAtFrom: new Date(operatedAt.getTime() - 60_000),
            operatedAtTo: new Date(operatedAt.getTime() + 60_000),
            transactionIds: [scopedExpense.id, scopedIncome.id]
        });

        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expect(canonicals).toHaveLength(1);
        expect(testQueryService.fetchTransactionById(scopedExpense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(testQueryService.fetchTransactionById(scopedIncome.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(testQueryService.fetchTransactionById(unrelatedExpense.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(unrelatedIncome.id).consolidationParentTransactionId).toBeNull();
    });
});

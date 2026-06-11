import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/transfer-pair-by-iban', () => {
    it('promotes matching expense and income counter-IBAN rows into a canonical transfer', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { fromAccount, toAccount } = testSeedService.accountPair('UA-FROM', 'UA-TO');
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        const expense = testSeedService.bankPairExpense(
            { externalId: 'iban-expense', operatedAt },
            { accountId: fromAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id, toIban: 'UA-TO' }
        );
        const income = testSeedService.bankPairIncome(
            { externalId: 'iban-income', operatedAt: new Date(operatedAt.getTime() + 5_000) },
            { accountId: toAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );
        const tag = testSeedService.tag('Transfer Source');
        testSeedService.transactionTag(expense.id, tag.id);
        testSeedService.transactionTag(income.id, tag.id);

        const result = await runConsolidation();
        expect(result.consolidated).toBe(1);

        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(canonicals[0].fromAccountId).toBe(fromAccount.id);
        expect(canonicals[0].toAccountId).toBe(toAccount.id);

        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(testQueryService.fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonicals[0].id);

        const movedEntries = testQueryService.fetchEntriesByTransactionId(canonicals[0].id);
        const sourceIds = movedEntries.flatMap(entry => (isDefined(entry.originalTransactionId) ? [entry.originalTransactionId] : []));
        expect(sourceIds.sort()).toEqual([expense.id, income.id].sort());
        expect(testQueryService.fetchTransactionTagIds(canonicals[0].id)).toHaveLength(0);
    });
});

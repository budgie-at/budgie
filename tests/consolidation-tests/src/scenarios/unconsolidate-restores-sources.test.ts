import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    expectRevertRemovedCanonical,
    fetchLedgerBalances,
    fetchSingleCanonicalId,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const TRANSFER_PAIR_AMOUNT = 250 * PRECISION;

describe('consolidation/unconsolidate-restores-sources', () => {
    it('deletes the canonical transfer and restores source ledger entries', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { expense, income } = testSeedService.amountTransferPair(TRANSFER_PAIR_AMOUNT, transferMcc.id);

        const result = await runConsolidation();
        expect(result.consolidated).toBe(1);

        const canonicalId = await revertSingleCanonical(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        expectRevertRemovedCanonical(canonicalId, [expense.id, income.id]);
        expect(testQueryService.fetchEntryByExternalId('tx-expense').transactionId).toBe(expense.id);
        expect(testQueryService.fetchEntryByExternalId('tx-income').transactionId).toBe(income.id);

        const secondResult = await runConsolidation();
        expect(secondResult.consolidated).toBe(1);
    });

    it('keeps source tags on the sources and restores account balances when the canonical transfer is reverted', async () => {
        const { expense, fromAccount, income, toAccount } = testSeedService.amountTransferPair(
            TRANSFER_PAIR_AMOUNT,
            testQueryService.findMccByCode('4829').id
        );
        const tag = testSeedService.tag('Travel');
        const accountIds = [fromAccount.id, toAccount.id];

        testSeedService.transactionTag(expense.id, tag.id);
        const balancesBeforeConsolidation = await fetchLedgerBalances(accountIds);

        await runConsolidation();
        const canonicalId = fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        expect(testQueryService.fetchTransactionTagIds(canonicalId)).toEqual([]);

        await revertSingleCanonical(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        expectRevertRemovedCanonical(canonicalId, [expense.id, income.id]);
        expect(testQueryService.fetchTransactionTagIds(expense.id)).toEqual([tag.id]);
        expect(await fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
    });
});

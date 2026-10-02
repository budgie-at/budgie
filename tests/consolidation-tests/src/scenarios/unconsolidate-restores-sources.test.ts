import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectRevertRemovedCanonical,
    fetchLedgerBalances,
    fetchSingleCanonicalId,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const TRANSFER_PAIR_AMOUNT = 250 * PRECISION;

layer(TestLayer)('consolidation/unconsolidate-restores-sources', it => {
    it.effect('deletes the canonical transfer and restores source ledger entries', () =>
        Effect.gen(function* () {
            const transferMcc = testQueryService.findMccByCode('4829');
            const { expense, income } = testSeedService.amountTransferPair(TRANSFER_PAIR_AMOUNT, transferMcc.id);

            const result = yield* runConsolidation();
            expect(result.consolidated).toBe(1);

            const canonicalId = yield* revertSingleCanonical(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expectRevertRemovedCanonical(canonicalId, [expense.id, income.id]);
            expect(testQueryService.fetchEntryByExternalId('tx-expense').transactionId).toBe(expense.id);
            expect(testQueryService.fetchEntryByExternalId('tx-income').transactionId).toBe(income.id);

            const secondResult = yield* runConsolidation();
            expect(secondResult.consolidated).toBe(1);
        })
    );

    it.effect('keeps source tags on the sources and restores account balances when the canonical transfer is reverted', () =>
        Effect.gen(function* () {
            const { expense, fromAccount, income, toAccount } = testSeedService.amountTransferPair(
                TRANSFER_PAIR_AMOUNT,
                testQueryService.findMccByCode('4829').id
            );
            const tag = testSeedService.tag('Travel');
            const accountIds = [fromAccount.id, toAccount.id];

            testSeedService.transactionTag(expense.id, tag.id);
            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);

            yield* runConsolidation();
            const canonicalId = fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expect(testQueryService.fetchTransactionTagIds(canonicalId)).toEqual([]);

            yield* revertSingleCanonical(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expectRevertRemovedCanonical(canonicalId, [expense.id, income.id]);
            expect(testQueryService.fetchTransactionTagIds(expense.id)).toEqual([tag.id]);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
        })
    );
});

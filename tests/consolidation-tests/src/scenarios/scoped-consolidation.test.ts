import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/scoped-consolidation', it => {
    it.effect('only consolidates candidates touching scoped transaction ids inside the same operated-at window', () =>
        Effect.gen(function* () {
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

            const result = yield* runConsolidation({
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
        })
    );
});

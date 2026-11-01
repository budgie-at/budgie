import { PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    markConsolidatedChild,
    readBudgetSpent,
    readParityStatistics,
    seedParityAccounts,
    seedParityExpense,
    seedParityTransfer,
    testSeedService,
    TestLayer
} from '../harness';

layer(TestLayer)('budget spent parity with statistics', it => {
    it.effect('matches the statistics expense for consolidated children, debt accounts and fees', () =>
        Effect.gen(function* () {
            const { bankAccount, counterpartAccount, debtAccount } = yield* seedParityAccounts();

            yield* seedParityExpense('plain', bankAccount.id, 10);

            const transfer = yield* seedParityTransfer(bankAccount.id, counterpartAccount.id, 30);
            const consolidatedChild = yield* seedParityExpense('consolidated-child', bankAccount.id, 30);

            yield* markConsolidatedChild(consolidatedChild.id, transfer.id);

            yield* seedParityExpense('debt', debtAccount.id, 20);

            const feeTransaction = yield* seedParityExpense('with-fee', bankAccount.id, 5);

            yield* testSeedService.feeEntry(feeTransaction.id, 'fee', { accountId: bankAccount.id, amount: 2 * PRECISION });

            const spentOverall = yield* readBudgetSpent();
            const statistics = yield* readParityStatistics();

            expect(statistics.expense).toBe(17 * PRECISION);
            expect(spentOverall).toBe(statistics.expense);
        })
    );
});

import { PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    markConsolidatedChild,
    readBudgetIncomeReceived,
    readParityStatistics,
    seedParityAccounts,
    seedParityExpense,
    seedParityIncome,
    seedParityTransfer,
    TestLayer
} from '../harness';

const OUTSIDE_WINDOW = new Date('2026-05-20T12:00:00.000Z');

layer(TestLayer)('budget income received', it => {
    it.effect('matches the statistics income and ignores expenses, transfers, debt accounts and consolidated children', () =>
        Effect.gen(function* () {
            const { bankAccount, counterpartAccount, debtAccount } = yield* seedParityAccounts();

            yield* seedParityIncome('salary', bankAccount.id, 2000);
            yield* seedParityIncome('previous-month', bankAccount.id, 900, OUTSIDE_WINDOW);
            yield* seedParityExpense('groceries', bankAccount.id, 30);
            yield* seedParityIncome('debt-income', debtAccount.id, 70);
            yield* seedParityTransfer(bankAccount.id, counterpartAccount.id, 150);

            const transfer = yield* seedParityTransfer(bankAccount.id, counterpartAccount.id, 40);
            const consolidatedChild = yield* seedParityIncome('consolidated-income', bankAccount.id, 40);

            yield* markConsolidatedChild(consolidatedChild.id, transfer.id);

            const incomeReceived = yield* readBudgetIncomeReceived();
            const statistics = yield* readParityStatistics();

            expect(statistics.income).toBe(2_000 * PRECISION);
            expect(incomeReceived).toBe(statistics.income);
        })
    );
});

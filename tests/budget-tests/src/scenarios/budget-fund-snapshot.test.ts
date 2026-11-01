import { BudgetPeriodCloseService, BudgetPeriodSnapshotRepository, BudgetSinkingFundRepository } from '@budgie/budget';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { HISTORY_NOW, seedInsuranceFund, seedInsurancePayment, seedMonthSnapshot, TestLayer, units } from '../harness';

const seedInsuranceScenario = (isInsuranceLimited: boolean) =>
    Effect.gen(function* () {
        const { account, budget, fund, insurance } = yield* seedInsuranceFund(isInsuranceLimited, { fundedAmount: units(500) });

        yield* seedInsurancePayment(account.id, insurance.id, new Date(2026, 2, 10, 12));
        yield* seedMonthSnapshot(budget, new Date(2026, 0, 1), 0);

        return { budget, fund };
    });

const closeThenDropFundThenCloseAgain = (fundId: number) =>
    Effect.gen(function* () {
        const closeService = yield* BudgetPeriodCloseService;
        const fundRepository = yield* BudgetSinkingFundRepository;

        yield* closeService.closeDuePeriods(HISTORY_NOW);
        yield* fundRepository.delete(fundId);
        yield* closeService.closeDuePeriods(HISTORY_NOW);
    });

const findMarch = (budgetId: number) =>
    Effect.flatMap(BudgetPeriodSnapshotRepository, snapshotRepository =>
        Effect.map(snapshotRepository.findRecent(budgetId, 6), snapshots =>
            snapshots.find(snapshot => snapshot.periodStart.getTime() === new Date(2026, 2, 1).getTime())
        )
    );

layer(TestLayer)('snapshots net of sinking fund spend', it => {
    it.effect('stores a fund-paid bill in a limited category as covered, not as spend, and keeps it after the fund is settled', () =>
        Effect.gen(function* () {
            const { budget, fund } = yield* seedInsuranceScenario(true);

            yield* closeThenDropFundThenCloseAgain(fund.id);

            const march = yield* findMarch(budget.id);

            expect(march?.overallSpent).toBe(0);
            expect(march?.categories.map(category => [category.spent, category.fundCovered])).toEqual([[0, units(400)]]);
        })
    );

    it.effect('stores covered spend of categories without a limit on the Other side of the snapshot', () =>
        Effect.gen(function* () {
            const { budget, fund } = yield* seedInsuranceScenario(false);

            yield* closeThenDropFundThenCloseAgain(fund.id);

            const march = yield* findMarch(budget.id);

            expect(march?.overallSpent).toBe(0);
            expect(march?.otherSpent).toBe(0);
            expect(march?.otherFundCovered).toBe(units(400));
        })
    );
});

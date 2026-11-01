import { BudgetPeriodCloseService, BudgetSinkingFundRepository } from '@budgie/budget';
import { BudgetSinkingFundEntityTable } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { HISTORY_NOW, seedBudgetHistory, seedInsurancePayment, testDb, TestLayer, testSeedService, units } from '../harness';

const seedFundScenario = Effect.fnUntraced(function* (dueAt: Date, targetAmount: number, repeatEveryMonths: number | null) {
    const fundRepository = yield* BudgetSinkingFundRepository;
    const { budget, account } = yield* seedBudgetHistory({
        limitAmount: units(300),
        monthlySpent: units(150),
        budget: { isAutoTuneEnabled: false }
    });
    const insurance = yield* testSeedService.category('Insurance');
    const fund = yield* fundRepository.create({
        budgetId: budget.id,
        name: 'Insurance',
        categoryId: insurance.id,
        targetAmount,
        dueAt,
        repeatEveryMonths
    });

    yield* testDb
        .update(BudgetSinkingFundEntityTable)
        .set({ createdAt: new Date(2026, 0, 15) })
        .where(eq(BudgetSinkingFundEntityTable.id, fund.id));

    return { budget, account, insurance, fund };
});

const close = Effect.flatMap(BudgetPeriodCloseService, closeService => closeService.closeDuePeriods(HISTORY_NOW));

layer(TestLayer)('BudgetPeriodCloseService sinking funds', it => {
    it.effect('funds each closed period and does not fund it twice', () =>
        Effect.gen(function* () {
            const fundRepository = yield* BudgetSinkingFundRepository;
            const { budget } = yield* seedFundScenario(new Date(2026, 5, 20), units(1200), null);

            yield* close;

            const [funded] = yield* fundRepository.getByBudget(budget.id);

            expect(funded.fundedAmount).toBe(units(720));
            expect(funded.lastFundedPeriodStart).toEqual(new Date(2026, 3, 1));

            yield* close;

            const [afterRerun] = yield* fundRepository.getByBudget(budget.id);

            expect(afterRerun.fundedAmount).toBe(units(720));
        })
    );

    it.effect('consumes the drawn amount and removes a one-off fund once its due window has passed', () =>
        Effect.gen(function* () {
            const fundRepository = yield* BudgetSinkingFundRepository;
            const { budget, account, insurance } = yield* seedFundScenario(new Date(2026, 2, 20), units(600), null);

            yield* seedInsurancePayment(account.id, insurance.id, new Date(2026, 2, 10, 12));
            yield* close;

            expect(yield* fundRepository.getByBudget(budget.id)).toEqual([]);
        })
    );

    it.effect('rolls a repeating fund to the next year and keeps the balance the closed snapshots did not consume', () =>
        Effect.gen(function* () {
            const fundRepository = yield* BudgetSinkingFundRepository;
            const { budget, account, insurance } = yield* seedFundScenario(new Date(2026, 2, 20), units(600), 12);

            yield* seedInsurancePayment(account.id, insurance.id, new Date(2026, 2, 10, 12));
            yield* close;

            const [rolled] = yield* fundRepository.getByBudget(budget.id);

            expect(rolled.fundedAmount).toBe(units(300));
            expect(rolled.dueAt).toEqual(new Date(2027, 2, 20));
        })
    );
});

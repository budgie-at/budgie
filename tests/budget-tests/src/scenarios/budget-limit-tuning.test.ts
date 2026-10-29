import { BudgetCategoryLimitRepository, BudgetLimitChangeRepository, BudgetPeriodCloseService, BudgetRepository } from '@budgie/budget';
import { BudgetCategoryLimitEntityTable, BudgetEntityTable, BudgetLimitChangeReasonEnum, PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { HISTORY_NOW, seedBudgetHistory } from '../harness/seed-budget-history';
import { testDb, TestLayer } from '../harness/test-context';

const units = (amount: number): number => amount * PRECISION;

const closeAndRead = Effect.fnUntraced(function* (budgetId: number) {
    const closeService = yield* BudgetPeriodCloseService;
    const categoryLimitRepository = yield* BudgetCategoryLimitRepository;
    const changeRepository = yield* BudgetLimitChangeRepository;

    yield* closeService.closeDuePeriods(HISTORY_NOW);

    return {
        limitAmounts: (yield* categoryLimitRepository.getByBudget(budgetId)).map(limit => limit.limitAmount),
        changes: yield* changeRepository.findByBudget(budgetId, 10)
    };
});

layer(TestLayer)('BudgetPeriodCloseService limit tuning', it => {
    it.effect('lowers an under-spent category by 10 percent and logs the change', () =>
        Effect.gen(function* () {
            const { budget, category } = yield* seedBudgetHistory({ limitAmount: units(300), monthlySpent: units(150) });
            const { limitAmounts, changes } = yield* closeAndRead(budget.id);

            expect(limitAmounts).toEqual([units(270)]);
            expect(
                changes.map(change => ({
                    categoryId: change.categoryId,
                    previousAmount: change.previousAmount,
                    newAmount: change.newAmount,
                    reason: change.reason,
                    periodsObserved: change.periodsObserved,
                    periodStart: change.periodStart
                }))
            ).toEqual([
                {
                    categoryId: category.id,
                    previousAmount: units(300),
                    newAmount: units(270),
                    reason: BudgetLimitChangeReasonEnum.UNDER_SPENT,
                    periodsObserved: 3,
                    periodStart: new Date(2026, 3, 1)
                }
            ]);
        })
    );

    it.effect('raises an over-spent category by 10 percent', () =>
        Effect.gen(function* () {
            const { budget } = yield* seedBudgetHistory({ limitAmount: units(100), monthlySpent: units(200) });
            const { limitAmounts, changes } = yield* closeAndRead(budget.id);

            expect(limitAmounts).toEqual([units(110)]);
            expect(changes.map(change => change.reason)).toEqual([BudgetLimitChangeReasonEnum.OVER_SPENT]);
        })
    );

    it.effect('does not raise a limit when categories already fill the overall limit', () =>
        Effect.gen(function* () {
            const { budget } = yield* seedBudgetHistory({
                limitAmount: units(100),
                monthlySpent: units(200),
                budget: { overallLimit: units(100) }
            });
            const { limitAmounts, changes } = yield* closeAndRead(budget.id);

            expect(limitAmounts).toEqual([units(100)]);
            expect(changes).toEqual([]);
        })
    );

    it.effect('does not tune when auto-tuning is switched off', () =>
        Effect.gen(function* () {
            const { budget } = yield* seedBudgetHistory({
                limitAmount: units(300),
                monthlySpent: units(150),
                budget: { isAutoTuneEnabled: false }
            });
            const { limitAmounts, changes } = yield* closeAndRead(budget.id);

            expect(limitAmounts).toEqual([units(300)]);
            expect(changes).toEqual([]);
        })
    );

    it.effect('skips a limit the user edited in the current period', () =>
        Effect.gen(function* () {
            const { budget } = yield* seedBudgetHistory({ limitAmount: units(300), monthlySpent: units(150) });

            yield* testDb
                .update(BudgetCategoryLimitEntityTable)
                .set({ userEditedAt: new Date(2026, 4, 2) })
                .where(eq(BudgetCategoryLimitEntityTable.budgetId, budget.id));

            const { limitAmounts, changes } = yield* closeAndRead(budget.id);

            expect(limitAmounts).toEqual([units(300)]);
            expect(changes).toEqual([]);
        })
    );

    it.effect('lowers the Other limit by 10 percent', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const { budget } = yield* seedBudgetHistory({
                limitAmount: units(300),
                monthlySpent: units(150),
                budget: { otherLimit: units(100) }
            });

            yield* closeAndRead(budget.id);

            expect((yield* budgetRepository.findById(budget.id))?.otherLimit).toBe(units(90));
        })
    );

    it.effect('skips the Other limit the user edited in the current period', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const { budget } = yield* seedBudgetHistory({
                limitAmount: units(300),
                monthlySpent: units(150),
                budget: { otherLimit: units(100) }
            });

            yield* testDb
                .update(BudgetEntityTable)
                .set({ otherLimitUserEditedAt: new Date(2026, 4, 2) })
                .where(eq(BudgetEntityTable.id, budget.id));
            yield* closeAndRead(budget.id);

            expect((yield* budgetRepository.findById(budget.id))?.otherLimit).toBe(units(100));
        })
    );

    it.effect('does not move the same line again when the next period closes', () =>
        Effect.gen(function* () {
            const closeService = yield* BudgetPeriodCloseService;
            const categoryLimitRepository = yield* BudgetCategoryLimitRepository;
            const changeRepository = yield* BudgetLimitChangeRepository;
            const { budget } = yield* seedBudgetHistory({ limitAmount: units(300), monthlySpent: units(150) });

            yield* closeService.closeDuePeriods(HISTORY_NOW);
            yield* closeService.closeDuePeriods(new Date(2026, 5, 15, 12));

            expect((yield* categoryLimitRepository.getByBudget(budget.id)).map(limit => limit.limitAmount)).toEqual([units(270)]);
            expect(yield* changeRepository.findByBudget(budget.id, 10)).toHaveLength(1);
        })
    );

    it.effect('does not tune again when no new period closed', () =>
        Effect.gen(function* () {
            const { budget } = yield* seedBudgetHistory({ limitAmount: units(300), monthlySpent: units(150) });

            yield* closeAndRead(budget.id);

            const { limitAmounts, changes } = yield* closeAndRead(budget.id);

            expect(limitAmounts).toEqual([units(270)]);
            expect(changes).toHaveLength(1);
        })
    );
});

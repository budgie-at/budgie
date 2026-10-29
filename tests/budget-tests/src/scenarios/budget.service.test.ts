import { BudgetCategoryLimitRepository, BudgetRepository, BudgetService } from '@budgie/budget';
import { BudgetPeriodEnum, BudgetRolloverModeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { createTestBudget } from '../harness/create-test-budget';
import { TestLayer, testSeedService } from '../harness/test-context';

const INITIAL_OVERALL_LIMIT = 100_000_000;
const INITIAL_OTHER_LIMIT = 20_000_000;
const UPDATED_OVERALL_LIMIT = 120_000_000;
const UPDATED_OTHER_LIMIT = 30_000_000;
const FIRST_CATEGORY_ID = 11;
const SECOND_CATEGORY_ID = 12;
const THIRD_CATEGORY_ID = 13;
const FIRST_INITIAL_LIMIT = 30_000_000;
const SECOND_INITIAL_LIMIT = 40_000_000;
const FIRST_UPDATED_LIMIT = 35_000_000;
const THIRD_UPDATED_LIMIT = 45_000_000;

layer(TestLayer)('BudgetService', it => {
    it.effect('creates and updates a budget with category limits through the injected transaction boundary', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
            const budgetService = yield* BudgetService;
            const budget = yield* budgetService.createBudget({
                name: 'Monthly Budget',
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 1,
                useLastDayOfMonth: false,
                overallLimit: INITIAL_OVERALL_LIMIT,
                otherLimit: INITIAL_OTHER_LIMIT,
                instrumentId: 1,
                categoryLimits: [
                    { categoryId: FIRST_CATEGORY_ID, limitAmount: FIRST_INITIAL_LIMIT },
                    { categoryId: SECOND_CATEGORY_ID, limitAmount: SECOND_INITIAL_LIMIT }
                ]
            });

            const updatedBudget = yield* budgetService.updateBudget(budget.id, {
                name: 'Updated Budget',
                overallLimit: UPDATED_OVERALL_LIMIT,
                otherLimit: UPDATED_OTHER_LIMIT,
                categoryLimits: [
                    { categoryId: FIRST_CATEGORY_ID, limitAmount: FIRST_UPDATED_LIMIT },
                    { categoryId: THIRD_CATEGORY_ID, limitAmount: THIRD_UPDATED_LIMIT }
                ]
            });
            const activeBudget = yield* budgetRepository.findMain();
            const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);

            expect(updatedBudget.name).toBe('Updated Budget');
            expect(updatedBudget.overallLimit).toBe(UPDATED_OVERALL_LIMIT);
            expect(updatedBudget.otherLimit).toBe(UPDATED_OTHER_LIMIT);
            expect(activeBudget?.id).toBe(budget.id);
            expect(categoryLimits.map(limit => ({ categoryId: limit.categoryId, limitAmount: limit.limitAmount }))).toEqual([
                { categoryId: FIRST_CATEGORY_ID, limitAmount: FIRST_UPDATED_LIMIT },
                { categoryId: THIRD_CATEGORY_ID, limitAmount: THIRD_UPDATED_LIMIT }
            ]);
        })
    );

    it.effect('defaults the anchor of a weekly budget to a Monday and leaves monthly budgets without one', () =>
        Effect.gen(function* () {
            const weekly = yield* createTestBudget({ period: BudgetPeriodEnum.WEEKLY });
            const monthly = yield* createTestBudget();

            expect(weekly.periodAnchorDate?.getDay()).toBe(1);
            expect(monthly.periodAnchorDate).toBeNull();
        })
    );

    it.effect('defaults the anchor when an update changes the cadence without one', () =>
        Effect.gen(function* () {
            const budgetService = yield* BudgetService;
            const monthly = yield* createTestBudget();

            const biweekly = yield* budgetService.updateBudget(monthly.id, { period: BudgetPeriodEnum.BIWEEKLY });

            expect(biweekly.periodAnchorDate?.getDay()).toBe(1);
        })
    );

    it.effect('keeps the existing anchor when an update repeats the same cadence without one', () =>
        Effect.gen(function* () {
            const budgetService = yield* BudgetService;
            const anchor = new Date(2026, 0, 5);
            const weekly = yield* createTestBudget({ period: BudgetPeriodEnum.WEEKLY, periodAnchorDate: anchor });

            const updated = yield* budgetService.updateBudget(weekly.id, { period: BudgetPeriodEnum.WEEKLY });

            expect(updated.periodAnchorDate?.getTime()).toBe(anchor.getTime());
        })
    );

    it.effect('does not stamp userEditedAt when only the rollover mode changes', () =>
        Effect.gen(function* () {
            const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
            const budgetService = yield* BudgetService;
            const category = yield* testSeedService.category('Rollover');
            const budget = yield* createTestBudget({
                categoryLimits: [{ categoryId: category.id, limitAmount: FIRST_INITIAL_LIMIT, rolloverMode: BudgetRolloverModeEnum.NONE }]
            });
            const created = (yield* budgetCategoryLimitRepository.getByBudget(budget.id)).at(0);

            yield* budgetService.updateBudget(budget.id, {
                categoryLimits: [
                    { categoryId: category.id, limitAmount: FIRST_INITIAL_LIMIT, rolloverMode: BudgetRolloverModeEnum.SURPLUS }
                ]
            });

            const updated = (yield* budgetCategoryLimitRepository.getByBudget(budget.id)).at(0);

            expect(updated?.rolloverMode).toBe(BudgetRolloverModeEnum.SURPLUS);
            expect(updated?.userEditedAt?.getTime()).toBe(created?.userEditedAt?.getTime());
        })
    );

    it.effect('stamps userEditedAt on the form save path and leaves it untouched when tuning', () =>
        Effect.gen(function* () {
            const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
            const category = yield* testSeedService.category('Groceries');
            const budget = yield* createTestBudget({ categoryLimits: [{ categoryId: category.id, limitAmount: FIRST_INITIAL_LIMIT }] });
            const created = (yield* budgetCategoryLimitRepository.getByBudget(budget.id)).at(0);

            expect(created?.userEditedAt).toBeInstanceOf(Date);

            yield* budgetCategoryLimitRepository.applyTunedLimits([{ id: created?.id ?? 0, limitAmount: FIRST_UPDATED_LIMIT }]);

            const tuned = (yield* budgetCategoryLimitRepository.getByBudget(budget.id)).at(0);

            expect(tuned?.limitAmount).toBe(FIRST_UPDATED_LIMIT);
            expect(tuned?.userEditedAt?.getTime()).toBe(created?.userEditedAt?.getTime());
        })
    );

    it.effect('stamps otherLimitUserEditedAt only when the form changes the Other limit', () =>
        Effect.gen(function* () {
            const budgetRepository = yield* BudgetRepository;
            const budgetService = yield* BudgetService;
            const budget = yield* createTestBudget({ otherLimit: FIRST_INITIAL_LIMIT });

            expect(budget.otherLimitUserEditedAt).toBeInstanceOf(Date);

            yield* budgetRepository.update(budget.id, { otherLimitUserEditedAt: null });
            yield* budgetService.updateBudget(budget.id, { name: 'Renamed' });

            expect((yield* budgetRepository.findById(budget.id))?.otherLimitUserEditedAt).toBeNull();

            yield* budgetService.updateBudget(budget.id, { otherLimit: FIRST_UPDATED_LIMIT });

            expect((yield* budgetRepository.findById(budget.id))?.otherLimitUserEditedAt).toBeInstanceOf(Date);
        })
    );
});

import { BudgetService } from '@budgie/budget';
import { BudgetCategoryLimitRepository } from '@budgie/budget/query/budget-category-limit-repository';
import { BudgetRepository } from '@budgie/budget/query/budget-repository';
import { BudgetPeriodEnum, Db } from '@budgie/contracts';
import { layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer } from '../harness/test-context';

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
            const budgetRepository = new BudgetRepository(testDb);
            const budgetCategoryLimitRepository = new BudgetCategoryLimitRepository(testDb);
            const budgetService = new BudgetService(budgetRepository, budgetCategoryLimitRepository);
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
            const activeBudget = yield* Db.query(() => budgetRepository.findActive());
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
});

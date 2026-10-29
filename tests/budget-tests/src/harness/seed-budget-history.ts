import { AccountTypeEnum, BudgetCategoryLimitEntityTable, BudgetEntityTable, BudgetRolloverModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { createTestBudget } from './create-test-budget';
import { seedCategorizedExpense } from './seed-categorized-expense';
import { seedMonthSnapshot } from './seed-month-snapshot';
import { testDb, testSeedService } from './test-context';

import type { BudgetCreateInputInterface } from '@budgie/budget';

export const HISTORY_NOW = new Date(2026, 4, 15, 12);

const HISTORY_MONTH_INDEXES = [0, 1, 2, 3];

interface SeedBudgetHistoryInput {
    readonly limitAmount: number;
    readonly monthlySpent: number;
    readonly budget?: Partial<BudgetCreateInputInterface>;
}

export const seedBudgetHistory = Effect.fnUntraced(function* (input: SeedBudgetHistoryInput) {
    const category = yield* testSeedService.category('Groceries');
    const account = yield* testSeedService.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
    const budget = yield* createTestBudget({
        categoryLimits: [{ categoryId: category.id, limitAmount: input.limitAmount }],
        ...input.budget
    });

    yield* testDb
        .update(BudgetCategoryLimitEntityTable)
        .set({ userEditedAt: null })
        .where(eq(BudgetCategoryLimitEntityTable.budgetId, budget.id));
    yield* testDb.update(BudgetEntityTable).set({ otherLimitUserEditedAt: null }).where(eq(BudgetEntityTable.id, budget.id));
    yield* Effect.forEach(
        HISTORY_MONTH_INDEXES,
        monthIndex =>
            seedCategorizedExpense({
                accountId: account.id,
                categoryId: category.id,
                operatedAt: new Date(2026, monthIndex, 10, 12),
                amount: input.monthlySpent,
                externalId: `history-${monthIndex}`
            }),
        { discard: true }
    );
    yield* seedMonthSnapshot(budget, new Date(2026, 0, 1), input.monthlySpent, [
        {
            categoryId: category.id,
            limitAmount: input.limitAmount,
            rolloverMode: BudgetRolloverModeEnum.NONE,
            carriedIn: 0,
            spent: input.monthlySpent
        }
    ]);

    return { budget, category, account };
});

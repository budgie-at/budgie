import { BudgetPeriodSnapshotRepository } from '@budgie/budget';
import { AccountTypeEnum, BudgetCategoryLimitEntityTable, BudgetEntityTable, BudgetRolloverModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { createTestBudget } from './create-test-budget';
import { seedCategorizedExpense } from './seed-categorized-expense';
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
    const snapshotRepository = yield* BudgetPeriodSnapshotRepository;
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
    yield* snapshotRepository.create(
        {
            budgetId: budget.id,
            periodStart: new Date(2026, 0, 1),
            periodEnd: new Date(2026, 0, 31, 23, 59, 59, 999),
            overallLimit: budget.overallLimit,
            overallSpent: input.monthlySpent,
            otherLimit: budget.otherLimit,
            otherSpent: 0,
            otherCarriedIn: 0,
            otherRolloverMode: BudgetRolloverModeEnum.NONE,
            isReconstructed: false
        },
        [
            {
                categoryId: category.id,
                limitAmount: input.limitAmount,
                rolloverMode: BudgetRolloverModeEnum.NONE,
                carriedIn: 0,
                spent: input.monthlySpent
            }
        ]
    );

    return { budget, category, account };
});

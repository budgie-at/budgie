import { BudgetPeriodSnapshotRepository } from '@budgie/budget';
import { BudgetRolloverModeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import type { BudgetPeriodCategorySnapshotCreateEntityInterface } from '@budgie/contracts';

interface SnapshotBudget {
    readonly id: number;
    readonly overallLimit: number;
    readonly otherLimit: number;
}

export const seedMonthSnapshot = Effect.fnUntraced(function* (
    budget: SnapshotBudget,
    periodStart: Date,
    overallSpent: number,
    categories: readonly Omit<BudgetPeriodCategorySnapshotCreateEntityInterface, 'snapshotId'>[] = []
) {
    const snapshotRepository = yield* BudgetPeriodSnapshotRepository;

    return yield* snapshotRepository.create(
        {
            budgetId: budget.id,
            periodStart,
            periodEnd: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59, 999),
            overallLimit: budget.overallLimit,
            overallSpent,
            otherLimit: budget.otherLimit,
            otherSpent: 0,
            otherCarriedIn: 0,
            otherRolloverMode: BudgetRolloverModeEnum.NONE,
            isReconstructed: false
        },
        categories
    );
});

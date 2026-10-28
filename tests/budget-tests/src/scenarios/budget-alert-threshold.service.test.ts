import { BudgetAlertKindEnum, BudgetAlertScopeEnum, computeBudgetAlertTriggers } from '@budgie/budget';
import { describe, expect, it } from '@effect/vitest';

describe('computeBudgetAlertTriggers', () => {
    it('computes overall, category, and synthetic other triggers without persistence', () => {
        const triggers = computeBudgetAlertTriggers(
            { overallLimit: 100_000_000, otherLimit: 20_000_000 },
            {
                spentOverall: 90_000_000,
                spentByCategory: [
                    { categoryId: 11, spent: 50_000_000 },
                    { categoryId: 12, spent: 25_000_000 }
                ]
            },
            [{ categoryId: 11, limitAmount: 50_000_000 }]
        );

        expect(triggers).toEqual([
            { kind: BudgetAlertKindEnum.WARNING, scope: BudgetAlertScopeEnum.OVERALL, categoryId: null, threshold: 80 },
            { kind: BudgetAlertKindEnum.WARNING, scope: BudgetAlertScopeEnum.CATEGORY, categoryId: 11, threshold: 80 },
            { kind: BudgetAlertKindEnum.LIMIT, scope: BudgetAlertScopeEnum.CATEGORY, categoryId: 11, threshold: 100 },
            { kind: BudgetAlertKindEnum.WARNING, scope: BudgetAlertScopeEnum.OTHER, categoryId: null, threshold: 80 },
            { kind: BudgetAlertKindEnum.LIMIT, scope: BudgetAlertScopeEnum.OTHER, categoryId: null, threshold: 100 }
        ]);
    });
});

import { BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { scaleBudgetTemplateDraft } from '../src/template/utils/scale-budget-template-draft.util';

import type { BudgetTemplateDraftInterface } from '../src/template/interface/budget-template-draft.interface';

const MONTHLY_DRAFT: BudgetTemplateDraftInterface = {
    overallLimit: 3000,
    categoryLimits: [
        { categoryId: 1, limitAmount: 1000 },
        { categoryId: 2, limitAmount: 700 }
    ]
};

it.effect('returns the draft untouched for monthly budgets', () =>
    Effect.sync(() => {
        expect(scaleBudgetTemplateDraft(MONTHLY_DRAFT, BudgetPeriodEnum.MONTHLY)).toBe(MONTHLY_DRAFT);
    })
);

it.effect('scales a monthly draft down to a week by 7 / 30.4375', () =>
    Effect.sync(() => {
        expect(scaleBudgetTemplateDraft(MONTHLY_DRAFT, BudgetPeriodEnum.WEEKLY)).toEqual({
            overallLimit: 690,
            categoryLimits: [
                { categoryId: 1, limitAmount: 230 },
                { categoryId: 2, limitAmount: 161 }
            ]
        });
    })
);

it.effect('scales a monthly draft to two weeks', () =>
    Effect.sync(() => {
        expect(scaleBudgetTemplateDraft(MONTHLY_DRAFT, BudgetPeriodEnum.BIWEEKLY)).toEqual({
            overallLimit: 1380,
            categoryLimits: [
                { categoryId: 1, limitAmount: 460 },
                { categoryId: 2, limitAmount: 322 }
            ]
        });
    })
);

it.effect('scales a monthly draft up to a year as twelve months', () =>
    Effect.sync(() => {
        expect(scaleBudgetTemplateDraft(MONTHLY_DRAFT, BudgetPeriodEnum.YEARLY)).toEqual({
            overallLimit: 36000,
            categoryLimits: [
                { categoryId: 1, limitAmount: 12000 },
                { categoryId: 2, limitAmount: 8400 }
            ]
        });
    })
);

it.effect('keeps the overall limit at or above the sum of scaled category limits', () =>
    Effect.sync(() => {
        const draft: BudgetTemplateDraftInterface = {
            overallLimit: 100,
            categoryLimits: [
                { categoryId: 1, limitAmount: 60 },
                { categoryId: 2, limitAmount: 40 }
            ]
        };
        const scaled = scaleBudgetTemplateDraft(draft, BudgetPeriodEnum.WEEKLY);
        const categoriesTotal = scaled.categoryLimits.reduce((total, limit) => total + limit.limitAmount, 0);

        expect(scaled.overallLimit).toBeGreaterThanOrEqual(categoriesTotal);
    })
);

it.effect('drops category limits that scale to zero', () =>
    Effect.sync(() => {
        const scaled = scaleBudgetTemplateDraft(
            { overallLimit: 100, categoryLimits: [{ categoryId: 1, limitAmount: 1 }] },
            BudgetPeriodEnum.WEEKLY
        );

        expect(scaled.categoryLimits).toEqual([]);
    })
);

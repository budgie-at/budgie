import { BudgetTemplateService } from '@budgie/budget';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer } from '../harness/test-context';

const HUNDRED_MICRO_UNITS = 100_000_000;
const FIFTY_MICRO_UNITS = 50_000_000;
const SPIKE_MICRO_UNITS = 1_000_000_000;
const YEAR_2026 = 2026;

layer(TestLayer)('budgetTemplateService', it => {
    it.effect('ignores a one-month spike when building suggested category limits', () =>
        Effect.gen(function* () {
            const budgetTemplateService = yield* BudgetTemplateService;
            const draft = budgetTemplateService.buildSuggestedBudgetTemplate([
                { categoryId: 11, monthlyAmounts: [HUNDRED_MICRO_UNITS, HUNDRED_MICRO_UNITS, SPIKE_MICRO_UNITS] },
                { categoryId: 12, monthlyAmounts: [FIFTY_MICRO_UNITS, FIFTY_MICRO_UNITS, FIFTY_MICRO_UNITS] }
            ]);

            expect(draft).toEqual({
                overallLimit: 200,
                categoryLimits: [
                    { categoryId: 11, limitAmount: 100 },
                    { categoryId: 12, limitAmount: 100 }
                ]
            });
        })
    );

    it.effect('resolves generic template categories without treating the default Other category specially', () =>
        Effect.gen(function* () {
            const budgetTemplateService = yield* BudgetTemplateService;
            const draft = budgetTemplateService.resolveGenericBudgetTemplate(
                [
                    { id: 11, isDefault: true },
                    { id: 37, isDefault: true }
                ],
                'USD'
            );

            expect(draft).toEqual({
                overallLimit: 300,
                categoryLimits: [{ categoryId: 11, limitAmount: 300 }]
            });
        })
    );
});

layer(TestLayer)('budgetTemplateService suggested resolution', it => {
    it.effect('groups recent entries into monthly category averages inside the budget package', () =>
        Effect.gen(function* () {
            const budgetTemplateService = yield* BudgetTemplateService;
            const now = new Date(YEAR_2026, 5, 15);
            const config = { minWindowMonths: 2, maxWindowMonths: 2, minEntriesPerMonth: 1, minDistinctCategories: 2 };
            const entries = [
                { amount: HUNDRED_MICRO_UNITS, categoryId: 11, instrumentId: 1, rate: null, operatedAt: new Date(YEAR_2026, 3, 10) },
                { amount: HUNDRED_MICRO_UNITS, categoryId: 11, instrumentId: 1, rate: null, operatedAt: new Date(YEAR_2026, 4, 10) },
                { amount: FIFTY_MICRO_UNITS, categoryId: 12, instrumentId: 2, rate: 2, operatedAt: new Date(YEAR_2026, 3, 12) },
                { amount: FIFTY_MICRO_UNITS, categoryId: 12, instrumentId: 2, rate: 2, operatedAt: new Date(YEAR_2026, 4, 12) }
            ];

            const resolution = budgetTemplateService.buildSuggestedBudgetTemplateResolution(entries, now, 1, config);

            expect(resolution).toEqual({
                draft: {
                    overallLimit: 200,
                    categoryLimits: [
                        { categoryId: 11, limitAmount: 100 },
                        { categoryId: 12, limitAmount: 100 }
                    ]
                },
                isReady: true,
                isAvailable: true,
                stats: { months: 2, transactionsCount: 4, categoriesCount: 2 }
            });
        })
    );
});

import { budgetTemplateService } from '@budgie/budget';

import type { BudgetSuggestedSpentEntryInterface } from '@budgie/budget';

const HUNDRED_MICRO_UNITS = 100_000_000;
const FIFTY_MICRO_UNITS = 50_000_000;
const SPIKE_MICRO_UNITS = 1_000_000_000;
const YEAR_2025 = 2025;
const YEAR_2026 = 2026;
const DEFAULT_CATEGORY_ID = 11;
const DEFAULT_INSTRUMENT_ID = 1;
const DECEMBER_MONTH_INDEX = 11;
const ENTRY_DAY = 10;
const RECENT_MONTH_INDICES = [0, 1, 2, 3, 4] as const;
const SIX_MONTH_SUGGESTION_CONFIG = { minWindowMonths: 2, maxWindowMonths: 6, minEntriesPerMonth: 1, minDistinctCategories: 1 };

const createSuggestedSpentEntry = (year: number, monthIndex: number): BudgetSuggestedSpentEntryInterface => ({
    amount: HUNDRED_MICRO_UNITS,
    categoryId: DEFAULT_CATEGORY_ID,
    instrumentId: DEFAULT_INSTRUMENT_ID,
    rate: null,
    operatedAt: new Date(year, monthIndex, ENTRY_DAY)
});

describe('budgetTemplateService', () => {
    it('ignores a one-month spike when building suggested category limits', () => {
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
    });

    it('resolves generic template categories without treating the default Other category specially', () => {
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
    });
});

describe('budgetTemplateService suggested resolution', () => {
    it('groups recent entries into monthly category averages inside the budget package', () => {
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
    });
    it('uses six complete months when every recent month has enough entries', () => {
        const now = new Date(YEAR_2026, 5, 15);
        const entries = [
            createSuggestedSpentEntry(YEAR_2025, DECEMBER_MONTH_INDEX),
            ...RECENT_MONTH_INDICES.map(monthIndex => createSuggestedSpentEntry(YEAR_2026, monthIndex))
        ];

        const resolution = budgetTemplateService.buildSuggestedBudgetTemplateResolution(
            entries,
            now,
            DEFAULT_INSTRUMENT_ID,
            SIX_MONTH_SUGGESTION_CONFIG
        );

        expect(resolution.stats).toEqual({ months: 6, transactionsCount: 6, categoriesCount: 1 });
    });

    it('falls back to five complete months when the sixth month is sparse', () => {
        const now = new Date(YEAR_2026, 5, 15);
        const entries = RECENT_MONTH_INDICES.map(monthIndex => createSuggestedSpentEntry(YEAR_2026, monthIndex));

        const resolution = budgetTemplateService.buildSuggestedBudgetTemplateResolution(
            entries,
            now,
            DEFAULT_INSTRUMENT_ID,
            SIX_MONTH_SUGGESTION_CONFIG
        );

        expect(resolution.stats).toEqual({ months: 5, transactionsCount: 5, categoriesCount: 1 });
    });
});

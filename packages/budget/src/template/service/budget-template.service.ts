import { getMonth } from 'date-fns/getMonth';
import { getYear } from 'date-fns/getYear';
import { subMonths } from 'date-fns/subMonths';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { budgetPeriodService } from '../../period/service/budget-period.service';
import { BudgetSpentService } from '../../spent/service/budget-spent.service';
import { GENERIC_BUDGET_TEMPLATE_CATEGORIES } from '../constant/generic-budget-template.constant';
import {
    GENERIC_INITIAL_PRESET_TOTAL_BY_CURRENCY,
    GENERIC_INITIAL_PRESET_TOTAL_DEFAULT
} from '../constant/generic-preset-by-currency.constant';

import type { BudgetCategoryLimitInputInterface } from '../interface/budget-category-limit-input.interface';
import type { BudgetCategoryMonthlySpentInterface } from '../interface/budget-category-monthly-spent.interface';
import type { BudgetGenericCategoryRowInterface } from '../interface/budget-generic-category-row.interface';
import type { BudgetSuggestedSpentEntryInterface } from '../interface/budget-suggested-spent-entry.interface';
import type { BudgetSuggestedTemplateConfigInterface } from '../interface/budget-suggested-template-config.interface';
import type { BudgetTemplateDraftInterface } from '../interface/budget-template-draft.interface';
import type { BudgetTemplateResolutionInterface } from '../interface/budget-template-resolution.interface';

const TOP_CATEGORY_COUNT = 10;
const HUNDRED_STEP = 100;
const THOUSAND_STEP = 1000;
const SPIKE_MULTIPLIER = 2;
const GENERIC_ROUNDING_STEP = 100;
const MICRO_UNIT_PRECISION = THOUSAND_STEP * THOUSAND_STEP;
const ZERO_DRAFT: BudgetTemplateDraftInterface = { overallLimit: 0, categoryLimits: [] };

const convertFromMicroUnits = (amount: number): number => amount / MICRO_UNIT_PRECISION;

const roundToNiceStep = (value: number): number => {
    const step = value >= THOUSAND_STEP ? THOUSAND_STEP : HUNDRED_STEP;

    return Math.round(value / step) * step;
};

const computeSpikeAdjustedMonthlyAverage = (monthlyAmounts: readonly number[]): number => {
    const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
    const maxAmount = Math.max(...monthlyAmounts);
    const restAverage = (total - maxAmount) / (monthlyAmounts.length - 1);

    if (maxAmount > restAverage * SPIKE_MULTIPLIER) {
        return restAverage;
    }

    return total / monthlyAmounts.length;
};

const buildSuggestedBudgetTemplate = (spentByCategory: readonly BudgetCategoryMonthlySpentInterface[]): BudgetTemplateDraftInterface => {
    const averaged = spentByCategory.map(entry => ({
        categoryId: entry.categoryId,
        monthlyAvg: computeSpikeAdjustedMonthlyAverage(entry.monthlyAmounts)
    }));

    const sorted = [...averaged].sort((first, second) => second.monthlyAvg - first.monthlyAvg).slice(0, TOP_CATEGORY_COUNT);

    const categoryLimits = sorted
        .map(entry => ({
            categoryId: entry.categoryId,
            limitAmount: roundToNiceStep(convertFromMicroUnits(entry.monthlyAvg))
        }))
        .filter(entry => isPositiveNumber(entry.limitAmount));

    const monthlyTotal = averaged.reduce((sum, entry) => sum + entry.monthlyAvg, 0);
    const monthlyOverallRounded = roundToNiceStep(convertFromMicroUnits(monthlyTotal));
    const categoryLimitsSum = categoryLimits.reduce((sum, entry) => sum + entry.limitAmount, 0);
    const overallLimit = Math.max(categoryLimitsSum, monthlyOverallRounded);

    return { overallLimit, categoryLimits };
};

const resolveGenericCategoryLimits = (
    categories: readonly BudgetGenericCategoryRowInterface[],
    total: number
): BudgetCategoryLimitInputInterface[] =>
    GENERIC_BUDGET_TEMPLATE_CATEGORIES.flatMap(template => {
        const match = categories.find(category => category.isDefault && category.id === template.categoryId);

        if (!isDefined(match)) {
            return [];
        }

        const limitAmount = Math.round((total * template.weight) / GENERIC_ROUNDING_STEP) * GENERIC_ROUNDING_STEP;

        if (!isPositiveNumber(limitAmount)) {
            return [];
        }

        return [{ categoryId: match.id, limitAmount }];
    });

const resolveGenericBudgetTemplate = (
    categories: readonly BudgetGenericCategoryRowInterface[],
    currencyCode: string
): BudgetTemplateDraftInterface => {
    const total = GENERIC_INITIAL_PRESET_TOTAL_BY_CURRENCY[currencyCode] ?? GENERIC_INITIAL_PRESET_TOTAL_DEFAULT;
    const categoryLimits = resolveGenericCategoryLimits(categories, total);
    const overallLimit = isNotEmptyArray(categoryLimits) ? categoryLimits.reduce((sum, entry) => sum + entry.limitAmount, 0) : total;

    return { overallLimit, categoryLimits };
};

const hasMinimumHistory = (entries: readonly BudgetSuggestedSpentEntryInterface[], now: Date, minWindowMonths: number): boolean => {
    const minHistoryThreshold = subMonths(now, minWindowMonths).getTime();

    return entries.some(entry => entry.operatedAt.getTime() <= minHistoryThreshold);
};

const isSuggestedTemplateAvailable = (
    draft: BudgetTemplateDraftInterface,
    monthlySpentByCategory: readonly BudgetCategoryMonthlySpentInterface[],
    minDistinctCategories: number,
    hasHistory: boolean
): boolean => isNotEmptyArray(draft.categoryLimits) && monthlySpentByCategory.length >= minDistinctCategories && hasHistory;

const emptySuggestedResolution = (isReady: boolean): BudgetTemplateResolutionInterface => ({
    draft: ZERO_DRAFT,
    isReady,
    isAvailable: false,
    stats: null
});

export class BudgetTemplateService extends Context.Service<BudgetTemplateService>()('@budgie/budget/BudgetTemplateService', {
    make: Effect.gen(function* () {
        const budgetSpentService = yield* BudgetSpentService;

        const resolveEffectiveMonths = (
            entries: readonly BudgetSuggestedSpentEntryInterface[],
            now: Date,
            config: BudgetSuggestedTemplateConfigInterface
        ): number => {
            const windowStartMax = budgetPeriodService.computeTrailingMonthsWindow(now, config.maxWindowMonths).start;

            return budgetPeriodService.resolveSuggestedWindowMonths(
                entries.map(entry => entry.operatedAt),
                windowStartMax,
                config.maxWindowMonths,
                config.minEntriesPerMonth
            );
        };

        const groupMonthlySpentByCategory = (
            entries: readonly BudgetSuggestedSpentEntryInterface[],
            windowStart: Date,
            months: number,
            baseInstrumentId: number
        ): BudgetCategoryMonthlySpentInterface[] => {
            const totalsByCategory = new Map<number, number[]>();

            for (const entry of entries) {
                const monthIndex =
                    (getYear(entry.operatedAt) - getYear(windowStart)) * 12 + getMonth(entry.operatedAt) - getMonth(windowStart);
                const isInsideWindow = monthIndex >= 0 && monthIndex < months;

                if (isDefined(entry.categoryId) && isInsideWindow) {
                    const convertedAmount = budgetSpentService.convertEntryAmount(entry, baseInstrumentId);
                    const currentMonthlyAmounts = totalsByCategory.get(entry.categoryId);
                    const monthlyAmounts = isDefined(currentMonthlyAmounts)
                        ? currentMonthlyAmounts
                        : Array.from({ length: months }, () => 0);
                    monthlyAmounts[monthIndex] += convertedAmount;
                    totalsByCategory.set(entry.categoryId, monthlyAmounts);
                }
            }

            return [...totalsByCategory.entries()].map(([categoryId, monthlyAmounts]) => ({ categoryId, monthlyAmounts }));
        };

        return {
            buildSuggestedBudgetTemplate,
            resolveGenericBudgetTemplate,
            buildSuggestedBudgetTemplateResolution: (
                entries: readonly BudgetSuggestedSpentEntryInterface[],
                now: Date,
                baseInstrumentId: number,
                config: BudgetSuggestedTemplateConfigInterface
            ): BudgetTemplateResolutionInterface => {
                const effectiveMonths = resolveEffectiveMonths(entries, now, config);

                if (effectiveMonths < config.minWindowMonths) {
                    return emptySuggestedResolution(true);
                }

                const windowStart = budgetPeriodService.computeTrailingMonthsWindow(now, effectiveMonths).start;
                const recentEntries = entries.filter(entry => entry.operatedAt.getTime() >= windowStart.getTime());
                const monthlySpentByCategory = groupMonthlySpentByCategory(recentEntries, windowStart, effectiveMonths, baseInstrumentId);
                const draft = buildSuggestedBudgetTemplate(monthlySpentByCategory);
                const isAvailable = isSuggestedTemplateAvailable(
                    draft,
                    monthlySpentByCategory,
                    config.minDistinctCategories,
                    hasMinimumHistory(entries, now, config.minWindowMonths)
                );
                const stats = {
                    months: effectiveMonths,
                    transactionsCount: recentEntries.length,
                    categoriesCount: monthlySpentByCategory.length
                };

                return { draft, isReady: true, isAvailable, stats };
            }
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetTemplateService, BudgetTemplateService.make).pipe(Layer.provide(BudgetSpentService.layer));
}

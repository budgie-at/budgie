import { Log } from '@budgie/logger';
import { getMonth, getYear, subMonths } from 'date-fns';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { budgetPeriodService } from '../../period/service/budget-period.service';
import { budgetSpentService } from '../../spent/service/budget-spent.service';
import { GENERIC_BUDGET_TEMPLATE_CATEGORIES } from '../constant/generic-budget-template.constant';
import { GENERIC_PRESET_TOTAL_BY_CURRENCY, GENERIC_PRESET_TOTAL_DEFAULT } from '../constant/generic-preset-by-currency.constant';

import type { BudgetCategoryLimitInputInterface } from '../interface/budget-category-limit-input.interface';
import type { BudgetCategoryMonthlySpentInterface } from '../interface/budget-category-monthly-spent.interface';
import type { BudgetGenericCategoryRowInterface } from '../interface/budget-generic-category-row.interface';
import type { BudgetSuggestedSpentEntryInterface } from '../interface/budget-suggested-spent-entry.interface';
import type { BudgetSuggestedTemplateConfigInterface } from '../interface/budget-suggested-template-config.interface';
import type { BudgetTemplateDraftInterface } from '../interface/budget-template-draft.interface';
import type { BudgetTemplateResolutionInterface } from '../interface/budget-template-resolution.interface';

class BudgetTemplateService {
    private static readonly TOP_CATEGORY_COUNT = 10;
    private static readonly HUNDRED_STEP = 100;
    private static readonly THOUSAND_STEP = 1000;
    private static readonly SPIKE_MULTIPLIER = 2;
    private static readonly GENERIC_ROUNDING_STEP = 100;
    private static readonly MICRO_UNIT_PRECISION = BudgetTemplateService.THOUSAND_STEP * BudgetTemplateService.THOUSAND_STEP;
    private static readonly ZERO_DRAFT: BudgetTemplateDraftInterface = { overallLimit: 0, categoryLimits: [] };

    @Log(
        spentByCategory =>
            `enter spentByCategory=${spentByCategory.map(entry => `${entry.categoryId}:${entry.monthlyAmounts.join('|')}`).join(',')}`,
        (result, spentByCategory) =>
            `done spentByCategory=${spentByCategory.map(entry => `${entry.categoryId}:${entry.monthlyAmounts.join('|')}`).join(',')} overallLimit=${result.overallLimit} categoryLimits=${result.categoryLimits.map(limit => `${limit.categoryId}:${limit.limitAmount}`).join(',')}`,
        (error, spentByCategory) =>
            `throw spentByCategory=${spentByCategory.map(entry => `${entry.categoryId}:${entry.monthlyAmounts.join('|')}`).join(',')} error=${getErrorMessage(error)}`
    )
    buildSuggestedBudgetTemplate(spentByCategory: readonly BudgetCategoryMonthlySpentInterface[]): BudgetTemplateDraftInterface {
        const averaged = spentByCategory.map(entry => ({
            categoryId: entry.categoryId,
            monthlyAvg: this.computeSpikeAdjustedMonthlyAverage(entry.monthlyAmounts)
        }));

        const sorted = [...averaged]
            .sort((first, second) => second.monthlyAvg - first.monthlyAvg)
            .slice(0, BudgetTemplateService.TOP_CATEGORY_COUNT);

        const categoryLimits = sorted
            .map(entry => ({
                categoryId: entry.categoryId,
                limitAmount: this.roundToNiceStep(this.convertFromMicroUnits(entry.monthlyAvg))
            }))
            .filter(entry => isPositiveNumber(entry.limitAmount));

        const monthlyTotal = averaged.reduce((sum, entry) => sum + entry.monthlyAvg, 0);
        const monthlyOverallRounded = this.roundToNiceStep(this.convertFromMicroUnits(monthlyTotal));
        const categoryLimitsSum = categoryLimits.reduce((sum, entry) => sum + entry.limitAmount, 0);
        const overallLimit = Math.max(categoryLimitsSum, monthlyOverallRounded);

        return { overallLimit, categoryLimits };
    }

    @Log(
        (categories, currencyCode) =>
            `enter categories=${categories.map(category => `${category.id}:${category.isDefault}`).join(',')} currencyCode="${currencyCode}"`,
        (result, categories, currencyCode) =>
            `done categories=${categories.map(category => `${category.id}:${category.isDefault}`).join(',')} currencyCode="${currencyCode}" overallLimit=${result.overallLimit} categoryLimits=${result.categoryLimits.map(limit => `${limit.categoryId}:${limit.limitAmount}`).join(',')}`,
        (error, categories, currencyCode) =>
            `throw categories=${categories.map(category => `${category.id}:${category.isDefault}`).join(',')} currencyCode="${currencyCode}" error=${getErrorMessage(error)}`
    )
    resolveGenericBudgetTemplate(
        categories: readonly BudgetGenericCategoryRowInterface[],
        currencyCode: string
    ): BudgetTemplateDraftInterface {
        const total = GENERIC_PRESET_TOTAL_BY_CURRENCY[currencyCode] ?? GENERIC_PRESET_TOTAL_DEFAULT;
        const categoryLimits = this.resolveGenericCategoryLimits(categories, total);
        const overallLimit = isNotEmptyArray(categoryLimits) ? categoryLimits.reduce((sum, entry) => sum + entry.limitAmount, 0) : total;

        return { overallLimit, categoryLimits };
    }

    @Log(
        (entries, now, baseInstrumentId, config) =>
            `enter entries=${entries.map(entry => `${entry.amount}:${isDefined(entry.categoryId) ? entry.categoryId : ''}:${entry.instrumentId}:${isDefined(entry.rate) ? entry.rate : ''}:${entry.operatedAt.toISOString()}`).join(',')} now=${now.toISOString()} baseInstrumentId=${baseInstrumentId} minWindowMonths=${config.minWindowMonths} maxWindowMonths=${config.maxWindowMonths} minEntriesPerMonth=${config.minEntriesPerMonth} minDistinctCategories=${config.minDistinctCategories}`,
        (result, ...[entries, now, baseInstrumentId, config]) =>
            `done entries=${entries.map(entry => `${entry.amount}:${isDefined(entry.categoryId) ? entry.categoryId : ''}:${entry.instrumentId}:${isDefined(entry.rate) ? entry.rate : ''}:${entry.operatedAt.toISOString()}`).join(',')} now=${now.toISOString()} baseInstrumentId=${baseInstrumentId} minWindowMonths=${config.minWindowMonths} maxWindowMonths=${config.maxWindowMonths} minEntriesPerMonth=${config.minEntriesPerMonth} minDistinctCategories=${config.minDistinctCategories} overallLimit=${result.draft.overallLimit} categoryLimits=${result.draft.categoryLimits.map(limit => `${limit.categoryId}:${limit.limitAmount}`).join(',')} isReady=${result.isReady} isAvailable=${result.isAvailable}`,
        (error, ...[entries, now, baseInstrumentId, config]) =>
            `throw entries=${entries.map(entry => `${entry.amount}:${isDefined(entry.categoryId) ? entry.categoryId : ''}:${entry.instrumentId}:${isDefined(entry.rate) ? entry.rate : ''}:${entry.operatedAt.toISOString()}`).join(',')} now=${now.toISOString()} baseInstrumentId=${baseInstrumentId} minWindowMonths=${config.minWindowMonths} maxWindowMonths=${config.maxWindowMonths} minEntriesPerMonth=${config.minEntriesPerMonth} minDistinctCategories=${config.minDistinctCategories} error=${getErrorMessage(error)}`
    )
    buildSuggestedBudgetTemplateResolution(
        entries: readonly BudgetSuggestedSpentEntryInterface[],
        now: Date,
        baseInstrumentId: number,
        config: BudgetSuggestedTemplateConfigInterface
    ): BudgetTemplateResolutionInterface {
        const effectiveMonths = this.resolveEffectiveMonths(entries, now, config);

        if (effectiveMonths < config.minWindowMonths) {
            return this.emptySuggestedResolution(true);
        }

        const hasMinimumHistory = this.hasMinimumHistory(entries, now, config.minWindowMonths);
        const windowStart = budgetPeriodService.computeTrailingMonthsWindow(now, effectiveMonths).start;
        const recentEntries = entries.filter(entry => entry.operatedAt.getTime() >= windowStart.getTime());
        const monthlySpentByCategory = this.groupMonthlySpentByCategory(recentEntries, windowStart, effectiveMonths, baseInstrumentId);
        const draft = this.buildSuggestedBudgetTemplate(monthlySpentByCategory);
        const isAvailable = this.isSuggestedTemplateAvailable(
            draft,
            monthlySpentByCategory,
            config.minDistinctCategories,
            hasMinimumHistory
        );
        const stats = this.buildSuggestedStats(effectiveMonths, recentEntries, monthlySpentByCategory);

        return { draft, isReady: true, isAvailable, stats };
    }

    private resolveEffectiveMonths(
        entries: readonly BudgetSuggestedSpentEntryInterface[],
        now: Date,
        config: BudgetSuggestedTemplateConfigInterface
    ): number {
        const windowStartMax = budgetPeriodService.computeTrailingMonthsWindow(now, config.maxWindowMonths).start;

        return budgetPeriodService.resolveSuggestedWindowMonths(entries, windowStartMax, config.maxWindowMonths, config.minEntriesPerMonth);
    }

    private hasMinimumHistory(entries: readonly BudgetSuggestedSpentEntryInterface[], now: Date, minWindowMonths: number): boolean {
        const minHistoryThreshold = subMonths(now, minWindowMonths).getTime();

        return entries.some(entry => entry.operatedAt.getTime() <= minHistoryThreshold);
    }

    private isSuggestedTemplateAvailable(
        draft: BudgetTemplateDraftInterface,
        monthlySpentByCategory: readonly BudgetCategoryMonthlySpentInterface[],
        minDistinctCategories: number,
        hasMinimumHistory: boolean
    ): boolean {
        const hasEnoughCategories = monthlySpentByCategory.length >= minDistinctCategories;

        return isNotEmptyArray(draft.categoryLimits) && hasEnoughCategories && hasMinimumHistory;
    }

    private buildSuggestedStats(
        months: number,
        recentEntries: readonly BudgetSuggestedSpentEntryInterface[],
        monthlySpentByCategory: readonly BudgetCategoryMonthlySpentInterface[]
    ) {
        return {
            months,
            transactionsCount: recentEntries.length,
            categoriesCount: monthlySpentByCategory.length
        };
    }

    private resolveGenericCategoryLimits(
        categories: readonly BudgetGenericCategoryRowInterface[],
        total: number
    ): BudgetCategoryLimitInputInterface[] {
        return GENERIC_BUDGET_TEMPLATE_CATEGORIES.flatMap(template => {
            const match = categories.find(category => category.isDefault && category.id === template.categoryId);

            if (!isDefined(match)) {
                return [];
            }

            const limitAmount = this.roundGenericLimit(total * template.weight);

            if (!isPositiveNumber(limitAmount)) {
                return [];
            }

            return [{ categoryId: match.id, limitAmount }];
        });
    }

    private groupMonthlySpentByCategory(
        entries: readonly BudgetSuggestedSpentEntryInterface[],
        windowStart: Date,
        months: number,
        baseInstrumentId: number
    ): BudgetCategoryMonthlySpentInterface[] {
        const totalsByCategory = new Map<number, number[]>();

        for (const entry of entries) {
            const monthIndex = (getYear(entry.operatedAt) - getYear(windowStart)) * 12 + getMonth(entry.operatedAt) - getMonth(windowStart);
            const isInsideWindow = monthIndex >= 0 && monthIndex < months;

            if (isDefined(entry.categoryId) && isInsideWindow) {
                const convertedAmount = budgetSpentService.convertEntryAmount(entry, baseInstrumentId);
                const currentMonthlyAmounts = totalsByCategory.get(entry.categoryId);
                const monthlyAmounts = isDefined(currentMonthlyAmounts) ? currentMonthlyAmounts : new Array<number>(months).fill(0);
                monthlyAmounts[monthIndex] += convertedAmount;
                totalsByCategory.set(entry.categoryId, monthlyAmounts);
            }
        }

        return [...totalsByCategory.entries()].map(([categoryId, monthlyAmounts]) => ({ categoryId, monthlyAmounts }));
    }

    private emptySuggestedResolution(isReady: boolean): BudgetTemplateResolutionInterface {
        return { draft: BudgetTemplateService.ZERO_DRAFT, isReady, isAvailable: false, stats: null };
    }

    private computeSpikeAdjustedMonthlyAverage(monthlyAmounts: readonly number[]): number {
        const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
        const maxAmount = Math.max(...monthlyAmounts);
        const restAverage = (total - maxAmount) / (monthlyAmounts.length - 1);

        if (maxAmount > restAverage * BudgetTemplateService.SPIKE_MULTIPLIER) {
            return restAverage;
        }

        return total / monthlyAmounts.length;
    }

    private roundToNiceStep(value: number): number {
        const step =
            value >= BudgetTemplateService.THOUSAND_STEP ? BudgetTemplateService.THOUSAND_STEP : BudgetTemplateService.HUNDRED_STEP;

        return Math.round(value / step) * step;
    }

    private roundGenericLimit(value: number): number {
        return Math.round(value / BudgetTemplateService.GENERIC_ROUNDING_STEP) * BudgetTemplateService.GENERIC_ROUNDING_STEP;
    }

    private convertFromMicroUnits(amount: number): number {
        return amount / BudgetTemplateService.MICRO_UNIT_PRECISION;
    }
}

export const budgetTemplateService = new BudgetTemplateService();

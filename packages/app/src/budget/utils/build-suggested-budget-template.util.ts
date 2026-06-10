import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

import type { BudgetTemplateDraftInterface } from '../interface/budget-template-draft.interface';

const TOP_CATEGORY_COUNT = 10;
const HUNDRED_STEP = 100;
const THOUSAND_STEP = 1000;
const SPIKE_MULTIPLIER = 2;

const roundToNiceStep = (value: number): number => {
    const step = value >= THOUSAND_STEP ? THOUSAND_STEP : HUNDRED_STEP;

    return Math.round(value / step) * step;
};

interface CategoryMonthlySpentInterface {
    readonly categoryId: number;
    readonly monthlyAmounts: readonly number[];
}

const computeSpikeAdjustedMonthlyAverage = (monthlyAmounts: readonly number[]): number => {
    const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
    const maxAmount = Math.max(...monthlyAmounts);
    const restAverage = (total - maxAmount) / (monthlyAmounts.length - 1);

    if (maxAmount > restAverage * SPIKE_MULTIPLIER) {
        return restAverage;
    }

    return total / monthlyAmounts.length;
};

export const buildSuggestedBudgetTemplate = (spentByCategory: readonly CategoryMonthlySpentInterface[]): BudgetTemplateDraftInterface => {
    const averaged = spentByCategory.map(entry => ({
        categoryId: entry.categoryId,
        monthlyAvg: computeSpikeAdjustedMonthlyAverage(entry.monthlyAmounts)
    }));

    const sorted = [...averaged].sort((first, second) => second.monthlyAvg - first.monthlyAvg).slice(0, TOP_CATEGORY_COUNT);

    const categoryLimits = sorted
        .map(entry => ({ categoryId: entry.categoryId, limitAmount: roundToNiceStep(convertFromMicroUnits(entry.monthlyAvg)) }))
        .filter(entry => entry.limitAmount > 0);

    const monthlyTotal = averaged.reduce((sum, entry) => sum + entry.monthlyAvg, 0);
    const monthlyOverallRounded = roundToNiceStep(convertFromMicroUnits(monthlyTotal));
    const categoryLimitsSum = categoryLimits.reduce((sum, entry) => sum + entry.limitAmount, 0);
    const overallLimit = Math.max(categoryLimitsSum, monthlyOverallRounded);

    return { overallLimit, categoryLimits };
};

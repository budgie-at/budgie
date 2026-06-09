import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

import type { BudgetTemplateDraftInterface } from '../interface/budget-template-draft.interface';

const TOP_CATEGORY_COUNT = 10;
const HUNDRED_STEP = 100;
const THOUSAND_STEP = 1000;

const roundToNiceStep = (value: number): number => {
    const step = value >= THOUSAND_STEP ? THOUSAND_STEP : HUNDRED_STEP;

    return Math.round(value / step) * step;
};

interface SpentByCategoryInterface {
    readonly categoryId: number;
    readonly spent: number;
}

export const buildSuggestedBudgetTemplate = (
    spentByCategory: readonly SpentByCategoryInterface[],
    months: number
): BudgetTemplateDraftInterface => {
    const sorted = [...spentByCategory]
        .map(entry => ({ categoryId: entry.categoryId, monthlyAvg: entry.spent / months }))
        .sort((first, second) => second.monthlyAvg - first.monthlyAvg)
        .slice(0, TOP_CATEGORY_COUNT);

    const categoryLimits = sorted
        .map(entry => ({ categoryId: entry.categoryId, limitAmount: roundToNiceStep(convertFromMicroUnits(entry.monthlyAvg)) }))
        .filter(entry => entry.limitAmount > 0);

    const totalSpent = spentByCategory.reduce((sum, entry) => sum + entry.spent, 0);
    const monthlyOverallRounded = roundToNiceStep(convertFromMicroUnits(totalSpent / months));
    const categoryLimitsSum = categoryLimits.reduce((sum, entry) => sum + entry.limitAmount, 0);
    const overallLimit = Math.max(categoryLimitsSum, monthlyOverallRounded);

    return { overallLimit, categoryLimits };
};

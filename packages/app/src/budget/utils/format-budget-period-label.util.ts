import { computePeriodWindow, getInclusiveEnd } from '@budgie/budget';

import type { BudgetPeriodSpecInterface } from '@budgie/budget';

export const formatBudgetPeriodLabel = (budget: BudgetPeriodSpecInterface, formatMonthAndDay: (date: Date) => string): string => {
    const window = computePeriodWindow(budget, new Date());
    const endDate = getInclusiveEnd(window.nextPeriodStart);

    return `${formatMonthAndDay(window.periodStart)} – ${formatMonthAndDay(endDate)}`;
};

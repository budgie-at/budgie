import { getInclusiveEnd } from '@budgie/budget';

import { resolveBudgetWindow } from './resolve-budget-window.util';

import type { BudgetWindowSourceInterface } from '../interface/budget-window-source.interface';

export const formatBudgetPeriodLabel = (budget: BudgetWindowSourceInterface, formatMonthAndDay: (date: Date) => string): string => {
    const window = resolveBudgetWindow(budget, new Date());
    const endDate = getInclusiveEnd(window.nextPeriodStart);

    return `${formatMonthAndDay(window.periodStart)} – ${formatMonthAndDay(endDate)}`;
};

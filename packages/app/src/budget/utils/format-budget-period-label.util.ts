import { computePeriodWindow } from './compute-period-window.util';
import { getBudgetPeriodInclusiveEnd } from './get-budget-period-inclusive-end.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

export const formatBudgetPeriodLabel = (
    budget: Pick<BudgetEntityInterface, 'periodStartDay' | 'useLastDayOfMonth'>,
    formatMonthAndDay: (date: Date) => string
): string => {
    const window = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
    const endDate = getBudgetPeriodInclusiveEnd(window.nextPeriodStart);

    return `${formatMonthAndDay(window.periodStart)} – ${formatMonthAndDay(endDate)}`;
};

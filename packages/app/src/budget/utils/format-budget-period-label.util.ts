import { budgetPeriodService } from '@budgie/budget';

import type { BudgetEntityInterface } from '@budgie/contracts';

export const formatBudgetPeriodLabel = (
    budget: Pick<BudgetEntityInterface, 'periodStartDay' | 'useLastDayOfMonth'>,
    formatMonthAndDay: (date: Date) => string
): string => {
    const window = budgetPeriodService.computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
    const endDate = budgetPeriodService.getInclusiveEnd(window.nextPeriodStart);

    return `${formatMonthAndDay(window.periodStart)} – ${formatMonthAndDay(endDate)}`;
};

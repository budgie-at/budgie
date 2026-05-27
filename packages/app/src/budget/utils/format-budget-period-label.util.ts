import { format } from 'date-fns';

import { computePeriodWindow } from './compute-period-window.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

export const formatBudgetPeriodLabel = (budget: Pick<BudgetEntityInterface, 'periodStartDay' | 'useLastDayOfMonth'>): string => {
    const window = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
    const endDate = new Date(window.nextPeriodStart.getTime() - 1);

    return `${format(window.periodStart, 'MMM d')} – ${format(endDate, 'MMM d')}`;
};

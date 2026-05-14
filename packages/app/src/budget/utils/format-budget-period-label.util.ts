import { format } from 'date-fns';

import { computePeriodWindow } from './compute-period-window.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

export const formatBudgetPeriodLabel = (
    budget: Pick<BudgetEntityInterface, 'periodStartDay' | 'useLastDayOfMonth'>,
    style: 'short' | 'long'
): string => {
    const window = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
    const endDate = new Date(window.nextPeriodStart.getTime() - 1);
    const startLabel = style === 'short' ? format(window.periodStart, 'MMM d') : format(window.periodStart, 'MMM d, yyyy');
    const endLabel = style === 'short' ? format(endDate, 'MMM d') : format(endDate, 'MMM d, yyyy');

    return `${startLabel} – ${endLabel}`;
};

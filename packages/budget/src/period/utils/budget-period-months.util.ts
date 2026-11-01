import { addMonths } from 'date-fns/addMonths';
import { startOfMonth } from 'date-fns/startOfMonth';

import { getInclusiveEnd } from './budget-period.util';

import type { BudgetPeriodWindowInterface } from '../interface/budget-period-window.interface';

export const buildPeriodMonths = (window: BudgetPeriodWindowInterface): Date[] => {
    const lastMonth = startOfMonth(getInclusiveEnd(window.nextPeriodStart));
    const months = [startOfMonth(window.periodStart)];

    while (months[months.length - 1].getTime() < lastMonth.getTime()) {
        months.push(addMonths(months[months.length - 1], 1));
    }

    return months;
};

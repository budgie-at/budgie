import { addDays } from 'date-fns/addDays';
import { startOfDay } from 'date-fns/startOfDay';

import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';

const FUND_DUE_WINDOW_DAYS = 30;

export const computeFundDueWindow = (dueAt: Date): BudgetPeriodWindowInterface => ({
    periodStart: addDays(startOfDay(dueAt), -FUND_DUE_WINDOW_DAYS),
    nextPeriodStart: addDays(startOfDay(dueAt), FUND_DUE_WINDOW_DAYS + 1)
});

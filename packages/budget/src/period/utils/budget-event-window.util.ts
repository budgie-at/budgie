import { addDays } from 'date-fns/addDays';
import { startOfDay } from 'date-fns/startOfDay';

import type { BudgetEventRangeInterface } from '../interface/budget-event-range.interface';
import type { BudgetPeriodWindowInterface } from '../interface/budget-period-window.interface';

export const computeEventWindow = (event: BudgetEventRangeInterface): BudgetPeriodWindowInterface => ({
    periodStart: startOfDay(event.startsAt),
    nextPeriodStart: addDays(startOfDay(event.endsAt), 1)
});

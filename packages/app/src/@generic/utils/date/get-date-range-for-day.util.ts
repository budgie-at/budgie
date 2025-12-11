import { DateFilterInterface } from '@budgie/contracts';

import { getEndOfDay } from './get-end-of-day.util';
import { getStartOfDay } from './get-start-of-day.util';

export const getDateRangeForDay = (date: Date): DateFilterInterface => ({
    from: getStartOfDay(date),
    to: getEndOfDay(date)
});

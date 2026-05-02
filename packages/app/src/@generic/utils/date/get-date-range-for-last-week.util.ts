import { DateRangeInterface } from '@budgie/contracts';

import { getEndOfDay } from './get-end-of-day.util';
import { getStartOfDay } from './get-start-of-day.util';

const DAYS_IN_WEEK = 7;

export const getDateRangeForLastWeek = (now: Date): DateRangeInterface => {
    const from = getStartOfDay(now);
    const day = from.getDay();

    const diffToMonday = (day + 6) % 7;
    from.setDate(from.getDate() - diffToMonday - DAYS_IN_WEEK);

    const to = getEndOfDay(new Date(from));
    to.setDate(from.getDate() + 6);

    return { from, to };
};

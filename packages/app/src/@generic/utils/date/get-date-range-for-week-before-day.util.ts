import { getEndOfDay } from './get-end-of-day.util';
import { getStartOfDay } from './get-start-of-day.util';
import { DateFilterInterface } from '@budgie/contracts';

export const getDateRangeForWeekBeforeDay = (now: Date): DateFilterInterface => {
    const from = getStartOfDay(now);
    const day = from.getDay();

    const diffToMonday = (day + 6) % 7;
    from.setDate(from.getDate() - diffToMonday);

    const to = getEndOfDay(new Date(from));
    to.setDate(from.getDate() + 6);

    return { from, to };
};

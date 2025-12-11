import { getStartOfDay } from './get-start-of-day.util';
import { DateFilterInterface } from '@budgie/contracts';

export const getDateRangeForMonthBeforeDay = (now: Date): DateFilterInterface => {
    const from = getStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { from, to };
};

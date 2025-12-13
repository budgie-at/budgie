import { DateRangeInterface } from '@budgie/contracts';

import { getStartOfDay } from './get-start-of-day.util';

export const getDateRangeForMonthBeforeDay = (now: Date): DateRangeInterface => {
    const from = getStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { from, to };
};

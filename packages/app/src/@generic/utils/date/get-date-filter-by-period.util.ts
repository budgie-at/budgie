import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';

import { getDateRangeForDay } from './get-date-range-for-day.util';
import { getDateRangeForLastMonth } from './get-date-range-for-last-month.util';
import { getDateRangeForLastWeek } from './get-date-range-for-last-week.util';
import { getDateRangeForMonthBeforeDay } from './get-date-range-for-month-before-day.util';
import { getDateRangeForWeekBeforeDay } from './get-date-range-for-week-before-day.util';
import { getDateRangeForYearBeforeDay } from './get-date-range-for-year-before-day.util';

export const getDateFilterByPeriod = (period: DatePeriodEnum): DateRangeInterface | null => {
    const now = new Date();

    switch (period) {
        case DatePeriodEnum.TODAY:
            return getDateRangeForDay(now);
        case DatePeriodEnum.THIS_WEEK:
            return getDateRangeForWeekBeforeDay(now);
        case DatePeriodEnum.LAST_WEEK:
            return getDateRangeForLastWeek(now);
        case DatePeriodEnum.THIS_MONTH:
            return getDateRangeForMonthBeforeDay(now);
        case DatePeriodEnum.LAST_MONTH:
            return getDateRangeForLastMonth(now);
        case DatePeriodEnum.THIS_YEAR:
            return getDateRangeForYearBeforeDay(now);
        case DatePeriodEnum.ALL_TIME:
            return { from: null, to: null };
        default:
            return null;
    }
};

import { DateFilterInterface, DatePeriodEnum } from '@budgie/contracts';

import { getDateRangeForMonthBeforeDay } from './get-date-range-for-month-before-day.util';
import { getDateRangeForWeekBeforeDay } from './get-date-range-for-week-before-day.util';
import { getDateRangeForYearBeforeDay } from './get-date-range-for-year-before-day.util';
import { getDateRangeForDay } from './get-date-range-for-day.util';

export const getDateFilterByPeriod = (period: DatePeriodEnum): DateFilterInterface | null => {
    const now = new Date();

    switch (period) {
        case DatePeriodEnum.TODAY:
            return getDateRangeForDay(now);
        case DatePeriodEnum.THIS_WEEK:
            return getDateRangeForWeekBeforeDay(now);
        case DatePeriodEnum.THIS_MONTH:
            return getDateRangeForMonthBeforeDay(now);
        case DatePeriodEnum.THIS_YEAR:
            return getDateRangeForYearBeforeDay(now);
        case DatePeriodEnum.ALL_TIME:
        default:
            return null;
    }
};

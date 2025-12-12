import { getDateRangeForMonthBeforeDay } from './get-date-range-for-month-before-day.util';
import { getDateRangeForWeekBeforeDay } from './get-date-range-for-week-before-day.util';
import { getDateRangeForYearBeforeDay } from './get-date-range-for-year-before-day.util';
import { getDateRangeForDay } from './get-date-range-for-day.util';
import { isDefined } from '@rnw-community/shared';
import { DateFilterInterface, DatePeriodEnum } from '@budgie/contracts';
import { isSameDateRange } from './is-same-date-range.util';

export const getPeriodByDateRange = (range: DateFilterInterface | null): DatePeriodEnum | null => {
    if (!isDefined(range) || (!isDefined(range.from) && !isDefined(range.to))) {
        return DatePeriodEnum.ALL_TIME;
    }

    const now = new Date();

    const todayRange = getDateRangeForDay(now);
    if (isSameDateRange(range, todayRange)) {
        return DatePeriodEnum.TODAY;
    }

    const weekRange = getDateRangeForWeekBeforeDay(now);
    if (isSameDateRange(range, weekRange)) {
        return DatePeriodEnum.THIS_WEEK;
    }

    const monthRange = getDateRangeForMonthBeforeDay(now);
    if (isSameDateRange(range, monthRange)) {
        return DatePeriodEnum.THIS_MONTH;
    }

    const yearRange = getDateRangeForYearBeforeDay(now);
    if (isSameDateRange(range, yearRange)) {
        return DatePeriodEnum.THIS_YEAR;
    }

    return null;
};

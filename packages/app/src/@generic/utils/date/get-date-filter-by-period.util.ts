import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';
import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    endOfYear,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
    subMonths,
    subWeeks
} from 'date-fns';

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export const getDateFilterByPeriod = (period: DatePeriodEnum): DateRangeInterface => {
    const now = new Date();
    const lastWeek = subWeeks(now, 1);
    const lastMonth = subMonths(now, 1);

    switch (period) {
        case DatePeriodEnum.TODAY:
            return { from: startOfDay(now), to: endOfDay(now) };
        case DatePeriodEnum.THIS_WEEK:
            return { from: startOfWeek(now, WEEK_OPTIONS), to: endOfWeek(now, WEEK_OPTIONS) };
        case DatePeriodEnum.LAST_WEEK:
            return { from: startOfWeek(lastWeek, WEEK_OPTIONS), to: endOfWeek(lastWeek, WEEK_OPTIONS) };
        case DatePeriodEnum.THIS_MONTH:
            return { from: startOfMonth(now), to: endOfMonth(now) };
        case DatePeriodEnum.LAST_MONTH:
            return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        case DatePeriodEnum.THIS_YEAR:
            return { from: startOfYear(now), to: endOfYear(now) };
        default:
            return { from: null, to: null };
    }
};

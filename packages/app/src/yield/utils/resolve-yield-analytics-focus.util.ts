import { YieldRangeEnum } from '@budgie/market';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { differenceInCalendarMonths } from 'date-fns/differenceInCalendarMonths';
import { differenceInCalendarWeeks } from 'date-fns/differenceInCalendarWeeks';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfWeek } from 'date-fns/endOfWeek';
import { format } from 'date-fns/format';
import { isSameDay } from 'date-fns/isSameDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfWeek } from 'date-fns/startOfWeek';

import { isDefined } from '@rnw-community/shared';

import type { YieldAnalyticsFocusInterface } from '../interface/yield-analytics-focus.interface';
import type { DateRangeInterface } from '@budgie/contracts';

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const MAX_MONTHS_BACK = 12;
const MAX_WEEKS_BACK = 12;
const MAX_DAYS_BACK = 29;
const UNFOCUSED: YieldAnalyticsFocusInterface = { range: YieldRangeEnum.YEAR, focusDay: null };

export const resolveYieldAnalyticsFocus = (date: DateRangeInterface | null, today: Date): YieldAnalyticsFocusInterface => {
    const from = date?.from;
    const to = date?.to;

    if (!isDefined(from) || !isDefined(to)) {
        return UNFOCUSED;
    }

    const day = format(from, 'yyyy-MM-dd');

    if (isSameDay(from, startOfMonth(from)) && isSameDay(to, endOfMonth(from))) {
        return differenceInCalendarMonths(today, from) <= MAX_MONTHS_BACK ? { range: YieldRangeEnum.YEAR, focusDay: day } : UNFOCUSED;
    }

    if (isSameDay(from, startOfWeek(from, WEEK_OPTIONS)) && isSameDay(to, endOfWeek(from, WEEK_OPTIONS))) {
        return differenceInCalendarWeeks(today, from, WEEK_OPTIONS) <= MAX_WEEKS_BACK
            ? { range: YieldRangeEnum.QUARTER, focusDay: day }
            : UNFOCUSED;
    }

    if (isSameDay(from, to)) {
        return differenceInCalendarDays(today, from) <= MAX_DAYS_BACK ? { range: YieldRangeEnum.MONTH, focusDay: day } : UNFOCUSED;
    }

    return UNFOCUSED;
};

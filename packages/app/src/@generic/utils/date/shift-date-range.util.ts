import { addDays } from 'date-fns/addDays';
import { addMonths } from 'date-fns/addMonths';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { differenceInCalendarMonths } from 'date-fns/differenceInCalendarMonths';
import { endOfMonth } from 'date-fns/endOfMonth';
import { startOfMonth } from 'date-fns/startOfMonth';

import { isDefined } from '@rnw-community/shared';

import { isWholeMonthRange } from './is-whole-month-range.util';

import type { DateRangeInterface } from '@budgie/contracts';

export const shiftDateRange = (range: DateRangeInterface | null, direction: number): DateRangeInterface | null => {
    if (!isDefined(range?.from) || !isDefined(range.to)) {
        return null;
    }

    const { from, to } = range;

    if (isWholeMonthRange(from, to)) {
        const months = (differenceInCalendarMonths(to, from) + 1) * direction;

        return { from: startOfMonth(addMonths(from, months)), to: endOfMonth(addMonths(to, months)) };
    }

    const days = (differenceInCalendarDays(to, from) + 1) * direction;

    return { from: addDays(from, days), to: addDays(to, days) };
};

import { isSameMonth } from 'date-fns';

import { isDefined } from '@rnw-community/shared';

import { isWholeMonthRange } from './is-whole-month-range.util';

import type { DateRangeInterface } from '@budgie/contracts';

export const getSingleMonth = (range: DateRangeInterface | null): Date | null => {
    const from = range?.from ?? null;
    const to = range?.to ?? null;

    return isDefined(from) && isDefined(to) && isSameMonth(from, to) && isWholeMonthRange(from, to) ? from : null;
};

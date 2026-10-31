import { useLingui } from '@lingui/react/macro';
import { differenceInCalendarMonths, endOfYear, isSameDay, isSameYear, startOfYear } from 'date-fns';

import { isDefined } from '@rnw-community/shared';

import { isWholeMonthRange } from '../../@generic/utils/date/is-whole-month-range.util';
import { useI18nContext } from '../context/i18n.context';

import { useFormatDate } from './use-format-date.hook';

import type { DateRangeInterface } from '@budgie/contracts';

export const useFormatDateRange = () => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const { formatFullMonthAndYear, formatDayAndMonthAndYear, formatMonthAndDay, formatShortMonth, formatMonthAndYear } = useFormatDate();

    const formatWholeMonths = (from: Date, to: Date) => {
        if (differenceInCalendarMonths(to, from) === 0) {
            return formatFullMonthAndYear(from);
        }

        const isWholeYear = from.getTime() === startOfYear(from).getTime() && to.getTime() === endOfYear(from).getTime();

        if (isWholeYear) {
            return intl.formatDate(from, { year: 'numeric' });
        }

        return `${isSameYear(from, to) ? formatShortMonth(from) : formatMonthAndYear(from)} – ${formatMonthAndYear(to)}`;
    };

    const formatDays = (from: Date, to: Date) => {
        if (isSameDay(from, to)) {
            return formatDayAndMonthAndYear(from);
        }

        return isSameYear(from, to)
            ? `${formatMonthAndDay(from)} – ${formatDayAndMonthAndYear(to)}`
            : `${formatDayAndMonthAndYear(from)} – ${formatDayAndMonthAndYear(to)}`;
    };

    return (range: DateRangeInterface | null) => {
        const from = range?.from ?? null;
        const to = range?.to ?? null;

        if (isDefined(from) && isDefined(to)) {
            return isWholeMonthRange(from, to) ? formatWholeMonths(from, to) : formatDays(from, to);
        }

        if (isDefined(from)) {
            const fromLabel = formatMonthAndDay(from);

            return t`Since ${fromLabel}`;
        }

        if (!isDefined(to)) {
            return t`All time`;
        }

        const toLabel = formatMonthAndDay(to);

        return t`Until ${toLabel}`;
    };
};

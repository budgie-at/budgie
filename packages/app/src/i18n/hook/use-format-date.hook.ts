import { minutesInDay } from 'date-fns/constants';
import { isThisYear } from 'date-fns/isThisYear';

import { useI18nContext } from '../context/i18n.context';

export const useFormatDate = () => {
    const { intl } = useI18nContext();

    return {
        formatRelativeToNow: (date: Date, now: number) => {
            const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60000));
            if (minutes < 1) {
                return intl.formatRelativeTime(0, 'second', { numeric: 'auto' });
            }
            if (minutes < 60) {
                return intl.formatRelativeTime(-minutes, 'minute');
            }
            if (minutes < minutesInDay) {
                return intl.formatRelativeTime(-Math.floor(minutes / 60), 'hour');
            }

            return intl.formatRelativeTime(-Math.floor(minutes / minutesInDay), 'day');
        },
        formatWeekdayAndDateWithTime: (date: Date | string) =>
            intl.formatDate(date, {
                weekday: 'long',
                month: 'short',
                year: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h24'
            }),
        formatMonthAndDay: (date: Date | string) => intl.formatDate(date, { month: 'short', day: 'numeric' }),
        formatMonthAndDayAndOptionalYear: (date: Date | string) =>
            intl.formatDate(date, { month: 'short', day: 'numeric', ...(!isThisYear(date) && { year: 'numeric' }) }),
        formatMonthAndDayWithTime: (date: Date | string) =>
            intl.formatDate(date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' }),
        formatTime: (date: Date | string) => intl.formatDate(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h24' }),
        formatWeekdayAndDay: (date: Date | string) =>
            intl.formatDate(date, { weekday: 'short', month: 'short', day: 'numeric', ...(!isThisYear(date) && { year: 'numeric' }) }),
        formatShortMonth: (date: Date | string) => intl.formatDate(date, { month: 'short' }),
        formatYear: (date: Date | string) => intl.formatDate(date, { year: 'numeric' }),
        formatWeekday: (date: Date | string) => intl.formatDate(date, { weekday: 'long' }),
        formatFullMonth: (date: Date | string) => intl.formatDate(date, { month: 'long' }),
        formatMonthAndYear: (date: Date | string) => intl.formatDate(date, { month: 'short', year: 'numeric' }),
        formatFullMonthAndYear: (date: Date | string) => intl.formatDate(date, { month: 'long', year: 'numeric' }),
        formatDayAndMonthAndYear: (date: Date | string) => intl.formatDate(date, { month: 'short', year: 'numeric', day: 'numeric' }),
        formatWeekdayWithTime: (date: Date | string) =>
            intl.formatDate(date, { weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' }),
        formatDayAndFullMonthAndYear: (date: Date | string) => intl.formatDate(date, { month: 'long', year: 'numeric', day: 'numeric' }),
        formatDayAndMonthAndYearWithTime: (date: Date | string) =>
            intl.formatDate(date, { month: 'short', year: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' })
    };
};

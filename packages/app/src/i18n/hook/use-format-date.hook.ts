import { isThisYear } from 'date-fns/isThisYear';

import { useI18nContext } from '../context/i18n.context';

export const useFormatDate = () => {
    const { intl } = useI18nContext();

    return {
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

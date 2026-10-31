import { isThisYear } from 'date-fns/isThisYear';

import { useI18nContext } from '../context/i18n.context';

export const useFormatDate = () => {
    const { intl } = useI18nContext();

    const formatMonthAndDay = (date: Date | string) => intl.formatDate(date, { month: 'short', day: 'numeric' });

    const formatMonthAndDayWithTime = (date: Date | string) =>
        intl.formatDate(date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });

    const formatWeekdayWithTime = (date: Date | string) =>
        intl.formatDate(date, { weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });

    const formatTime = (date: Date | string) => intl.formatDate(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });

    const formatWeekdayAndDay = (date: Date | string) =>
        intl.formatDate(date, { weekday: 'short', month: 'short', day: 'numeric', ...(!isThisYear(date) && { year: 'numeric' }) });

    const formatShortMonth = (date: Date | string) => intl.formatDate(date, { month: 'short' });

    const formatYear = (date: Date | string) => intl.formatDate(date, { year: 'numeric' });

    const formatWeekday = (date: Date | string) => intl.formatDate(date, { weekday: 'long' });

    const formatFullMonth = (date: Date | string) => intl.formatDate(date, { month: 'long' });

    const formatMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'short', year: 'numeric' });

    const formatShortWeekdayAndDay = (date: Date | string) => intl.formatDate(date, { weekday: 'short', day: 'numeric' });

    const formatFullMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'long', year: 'numeric' });

    const formatDayAndMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'short', year: 'numeric', day: 'numeric' });

    const formatDayAndFullMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'long', year: 'numeric', day: 'numeric' });

    const formatDayAndMonthAndYearWithTime = (date: Date | string) =>
        intl.formatDate(date, { month: 'short', year: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });

    return {
        formatMonthAndDay,
        formatTime,
        formatWeekdayAndDay,
        formatShortMonth,
        formatYear,
        formatWeekday,
        formatFullMonth,
        formatMonthAndYear,
        formatShortWeekdayAndDay,
        formatFullMonthAndYear,
        formatDayAndMonthAndYear,
        formatMonthAndDayWithTime,
        formatWeekdayWithTime,
        formatDayAndFullMonthAndYear,
        formatDayAndMonthAndYearWithTime
    };
};

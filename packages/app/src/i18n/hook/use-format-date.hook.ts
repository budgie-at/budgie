import { useI18nContext } from '../context/i18n.context';

export const useFormatDate = () => {
    const { intl } = useI18nContext();

    const formatMonthAndDay = (date: Date | string) => intl.formatDate(date, { month: 'short', day: 'numeric' });

    const formatMonthAndDayWithTime = (date: Date | string) =>
        intl.formatDate(date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });

    const formatWeekdayWithTime = (date: Date | string) =>
        intl.formatDate(date, { weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });

    const formatShortMonth = (date: Date | string) => intl.formatDate(date, { month: 'short' });

    const formatFullMonth = (date: Date | string) => intl.formatDate(date, { month: 'long' });

    const formatMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'short', year: 'numeric' });

    const formatDayAndMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'short', year: 'numeric', day: 'numeric' });

    const formatDayAndFullMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'long', year: 'numeric', day: 'numeric' });

    const formatDayAndMonthAndYearWithTime = (date: Date | string) =>
        intl.formatDate(date, { month: 'short', year: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });

    return {
        formatMonthAndDay,
        formatShortMonth,
        formatFullMonth,
        formatMonthAndYear,
        formatDayAndMonthAndYear,
        formatMonthAndDayWithTime,
        formatWeekdayWithTime,
        formatDayAndFullMonthAndYear,
        formatDayAndMonthAndYearWithTime
    };
};

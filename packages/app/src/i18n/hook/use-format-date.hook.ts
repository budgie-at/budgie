import { useI18nContext } from '../context/i18n.context';

export const useFormatDate = () => {
    const { intl } = useI18nContext();

    const formatMonthAndDay = (date: Date | string) => intl.formatDate(date, { month: 'short', day: 'numeric' });

    const formatMonthAndDayWithTime = (date: Date | string) =>
        intl.formatDate(date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h24' });

    const formatMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'short', year: 'numeric' });

    const formatDayAndMonthAndYear = (date: Date | string) => intl.formatDate(date, { month: 'short', year: 'numeric', day: 'numeric' });

    return { formatMonthAndDay, formatMonthAndYear, formatDayAndMonthAndYear, formatMonthAndDayWithTime };
};

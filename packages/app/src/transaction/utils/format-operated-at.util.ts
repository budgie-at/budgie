import { isToday, isYesterday } from 'date-fns';

interface FormatOperatedAtParams {
    readonly date: Date;
    readonly today: string;
    readonly yesterday: string;
    readonly formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
}

export const formatOperatedAt = ({ date, today, yesterday, formatDate }: FormatOperatedAtParams): string => {
    if (isToday(date)) {
        return today;
    }

    if (isYesterday(date)) {
        return yesterday;
    }

    return formatDate(date, { month: 'short', day: 'numeric' });
};

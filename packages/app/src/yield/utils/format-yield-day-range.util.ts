import { format } from 'date-fns/format';
import { isSameMonth } from 'date-fns/isSameMonth';

export const formatYieldDayRange = (first: Date, last: Date, formatMonthAndDay: (date: Date) => string): string => {
    const lastDay = isSameMonth(first, last) ? format(last, 'd') : formatMonthAndDay(last);

    return `${formatMonthAndDay(first)}–${lastDay}`.replaceAll(' ', ' ');
};

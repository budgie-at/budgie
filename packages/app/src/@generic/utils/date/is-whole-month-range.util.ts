import { endOfMonth } from 'date-fns/endOfMonth';
import { startOfMonth } from 'date-fns/startOfMonth';

export const isWholeMonthRange = (from: Date, to: Date): boolean =>
    from.getTime() === startOfMonth(from).getTime() && to.getTime() === endOfMonth(to).getTime();

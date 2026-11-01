import { endOfMonth, startOfMonth } from 'date-fns';

export const isWholeMonthRange = (from: Date, to: Date): boolean =>
    from.getTime() === startOfMonth(from).getTime() && to.getTime() === endOfMonth(to).getTime();

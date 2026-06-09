import { startOfMonth, subMonths } from 'date-fns';

interface TrailingMonthsWindow {
    readonly start: Date;
    readonly end: Date;
}

export const computeTrailingMonthsWindow = (now: Date, months: number): TrailingMonthsWindow => ({
    start: startOfMonth(subMonths(now, months)),
    end: startOfMonth(now)
});

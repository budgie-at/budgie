import { DateRangeInterface } from '@budgie/contracts';

export const getDateRangeForYearBeforeDay = (now: Date): DateRangeInterface => {
    const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    return { from, to };
};

import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { parseISO } from 'date-fns/parseISO';

export const countYieldDays = (fromDay: string, lastDay: string) => differenceInCalendarDays(parseISO(lastDay), parseISO(fromDay)) + 1;

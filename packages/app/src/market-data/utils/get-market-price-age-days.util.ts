import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { parseISO } from 'date-fns/parseISO';

export const getMarketPriceAgeDays = (priceDate: string): number => differenceInCalendarDays(new Date(), parseISO(priceDate));

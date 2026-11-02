import { getMarketPriceAgeDays } from './get-market-price-age-days.util';

const STALE_AFTER_DAYS = 1;

export const isMarketPriceStale = (priceDate: string): boolean => getMarketPriceAgeDays(priceDate) > STALE_AFTER_DAYS;

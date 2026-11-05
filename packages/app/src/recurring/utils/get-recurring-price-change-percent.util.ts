import type { RecurringPriceChangeInterface } from '@budgie/recurring';

export const getRecurringPriceChangePercent = (priceChange: Pick<RecurringPriceChangeInterface, 'fromAmount' | 'toAmount'>): number =>
    Math.round(((priceChange.toAmount - priceChange.fromAmount) / priceChange.fromAmount) * 100);

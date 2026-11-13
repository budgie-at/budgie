import type { YieldPriceLookupType } from './yield-price-lookup.type';

export interface YieldPriceSeriesInterface {
    readonly days: readonly string[];
    readonly prices: readonly number[];
    readonly carryDays: number;
    readonly isNearest: boolean;
    readonly isEstimable: boolean;
    readonly quoteToBase: YieldPriceLookupType;
    readonly fallbackPrice: YieldPriceLookupType;
}

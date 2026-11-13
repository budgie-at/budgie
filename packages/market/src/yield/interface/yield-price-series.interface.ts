export interface YieldPriceSeriesInterface {
    readonly days: readonly string[];
    readonly prices: readonly number[];
    readonly carryDays: number;
    readonly isNearest: boolean;
    readonly isEstimable: boolean;
    readonly isFiatPegged: boolean;
    readonly fallbackPrice: number | null;
}

export interface YieldPricePointInterface {
    readonly price: number | null;
    readonly isEstimated: boolean;
    readonly isFarEstimated: boolean;
    readonly sourceDay: string | null;
}

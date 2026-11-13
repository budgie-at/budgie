export interface YieldHoldingsInterface {
    readonly firstInflowDay: string | null;
    readonly historyDays: number;
    readonly days: number;
    readonly pricedDays: number;
    readonly averageUnits: number;
    readonly averageValue: number;
    readonly estimatedAverageValue: number;
    readonly droppedShare: number;
    readonly droppedDays: ReadonlySet<string>;
    readonly currentUnits: number;
}

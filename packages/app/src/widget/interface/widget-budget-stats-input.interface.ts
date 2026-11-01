export interface WidgetBudgetStatsInputInterface {
    readonly spentAmount: number;
    readonly limitAmount: number;
    readonly projectedAmount: number | null;
    readonly elapsedDays: number;
    readonly symbol: string;
}

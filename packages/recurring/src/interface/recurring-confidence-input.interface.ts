export interface RecurringConfidenceInputInterface {
    readonly periodDays: number;
    readonly cycleCount: number;
    readonly meanDeviationDays: number;
    readonly toleranceDays: number;
    readonly minimumAmount: number;
    readonly maximumAmount: number;
    readonly hasIban: boolean;
    readonly isVariable: boolean;
    readonly missedCycles: number;
}

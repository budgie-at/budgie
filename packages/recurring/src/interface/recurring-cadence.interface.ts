export interface RecurringCadenceInterface {
    readonly periodMonths: number | null;
    readonly periodDays: number;
    readonly toleranceDays: number;
    readonly windowDays: number;
    readonly fixedCycles: number;
    readonly variableCycles: number;
    readonly jitteryFixedCycles: number | null;
    readonly jitteryVariableCycles: number | null;
}

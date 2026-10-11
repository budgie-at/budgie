export interface RecurringCadenceInterface {
    readonly periodMonths: number | null;
    readonly periodDays: number;
    readonly toleranceDays: number;
}

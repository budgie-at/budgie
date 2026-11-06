export interface RecurringMatchInterface {
    readonly seriesId: number;
    readonly transactionId: number;
    readonly cycleDate: Date;
    readonly merchantKey: string | null;
}

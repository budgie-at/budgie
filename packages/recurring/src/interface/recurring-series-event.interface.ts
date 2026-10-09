export interface RecurringSeriesEventInterface {
    readonly timestamp: number;
    readonly occurrenceCount: number;
    readonly nativeAmount: number;
    readonly amount: number;
    readonly transactionId: number;
}

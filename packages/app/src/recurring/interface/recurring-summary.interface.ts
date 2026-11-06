export interface RecurringSummaryInterface {
    readonly committedMonthly: number;
    readonly committedCount: number;
    readonly hasAveragedBills: boolean;
    readonly dueSoonTotal: number;
    readonly dueSoonCount: number;
    readonly incomeMonthly: number;
}

export interface InstallmentPlanScheduleInterface {
    readonly installmentCount: number;
    readonly paidCount: number;
    readonly totalAmount: number;
    readonly paidAmount: number;
    readonly remainingAmount: number;
    readonly nextDueAt: Date | null;
    readonly nextAmount: number | null;
    readonly instrumentId: number;
}

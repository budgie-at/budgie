export interface InstallmentPlanConvertInputInterface {
    readonly transactionId: number;
    readonly installmentCount: number;
    readonly totalAmount: number;
    readonly title: string;
}

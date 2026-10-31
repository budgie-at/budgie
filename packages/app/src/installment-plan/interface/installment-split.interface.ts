export interface InstallmentSplitInterface {
    readonly installmentCount: number;
    readonly feePercent: number;
    readonly isCustomTotal: boolean;
    readonly planTotal: number;
    readonly baseAmount: number;
    readonly feeAmount: number;
    readonly regularAmount: number;
    readonly lastAmount: number;
    readonly isSinglePaymentLeft: boolean;
    readonly hasEqualParts: boolean;
    readonly isSplittable: boolean;
}

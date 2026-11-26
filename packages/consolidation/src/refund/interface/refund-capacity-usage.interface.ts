export interface RefundCapacityUsageInterface {
    readonly feeAmount: number;
    readonly liveFeeAmounts: readonly number[];
    readonly absorbedFeeAmounts: readonly number[];
    readonly absorbedFeeTotal: number;
    readonly absorbedPrincipalTotal: number;
    readonly isRejectedFeeTitle: boolean;
}

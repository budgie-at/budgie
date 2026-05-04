export interface RefundedSummaryInterface {
    readonly kind: 'full' | 'partial';
    readonly refundsTotal: number;
}

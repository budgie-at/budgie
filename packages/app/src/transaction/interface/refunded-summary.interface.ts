import type { RefundedSummaryKindEnum } from '../enum/refunded-summary-kind.enum';

export interface RefundedSummaryInterface {
    readonly kind: RefundedSummaryKindEnum;
    readonly refundsTotal: number;
}

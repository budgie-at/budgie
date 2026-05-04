import type { RefundedSummaryInterface } from './refunded-summary.interface';

export interface RefundedPillPropsInterface {
    readonly kind: RefundedSummaryInterface['kind'];
    readonly formattedRefundedAmount?: string;
    readonly onPress?: () => void;
    readonly testID?: string;
}

import { isAutoRefundConfidenceBucket } from '../type-guard/is-auto-refund-confidence-bucket.type-guard';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';
import type { RefundReviewCandidateInterface } from '@budgie/contracts';

class RefundEdgeMetrics {
    private static readonly feeBucket = 'AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE';
    private static readonly privatbankBucket = 'AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT';
    private static readonly bucketPriority: Record<RefundReviewCandidateInterface['confidenceBucket'], number> = {
        AUTO_REFUND_EXACT_TITLE: 1,
        AUTO_REFUND_LOCALIZED_REFUND_TITLE: 2,
        AUTO_REFUND_REJECTED_PAYMENT_PRINCIPAL_TITLE: 3,
        AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE: 4,
        AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT: 5,
        REVIEW_REFUND_PREFIX_TITLE_MCC: 6
    };

    readonly compareRefunds = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
        left.refundOperatedAt - right.refundOperatedAt ||
        this.compareText(left.refundSyncId, right.refundSyncId) ||
        left.refundTransactionId - right.refundTransactionId;

    readonly compareExpenses = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
        left.expenseOperatedAt - right.expenseOperatedAt ||
        this.compareText(left.expenseSyncId, right.expenseSyncId) ||
        left.expenseTransactionId - right.expenseTransactionId;

    readonly compareRefundRank = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
        Number(this.getShortfall(left) !== 0) - Number(this.getShortfall(right) !== 0) ||
        Number(!this.isCovering(left)) - Number(!this.isCovering(right)) ||
        this.compareBuckets(left, right) ||
        Math.abs(this.getShortfall(left)) - Math.abs(this.getShortfall(right)) ||
        this.getTimeDiff(left) - this.getTimeDiff(right) ||
        this.compareExpenses(left, right);

    readonly compareExpenseRank = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
        Number(this.getShortfall(left) !== 0) - Number(this.getShortfall(right) !== 0) ||
        this.compareBuckets(left, right) ||
        this.getTimeDiff(left) - this.getTimeDiff(right) ||
        this.compareRefunds(left, right);

    readonly compareNearest = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
        Number(this.getShortfall(left) !== 0) - Number(this.getShortfall(right) !== 0) ||
        this.getTimeDiff(left) - this.getTimeDiff(right) ||
        Math.abs(this.getShortfall(left)) - Math.abs(this.getShortfall(right)) ||
        this.compareExpenses(left, right);

    readonly isAuto = (edge: RefundEdgeRowInterface): boolean => isAutoRefundConfidenceBucket(edge.confidenceBucket);

    isFeeBucket(edge: RefundEdgeRowInterface): boolean {
        return edge.confidenceBucket === RefundEdgeMetrics.feeBucket;
    }

    isPrivatbankBucket(edge: RefundEdgeRowInterface): boolean {
        return edge.confidenceBucket === RefundEdgeMetrics.privatbankBucket;
    }

    getCapacity(edge: RefundEdgeRowInterface): number {
        if (this.isFeeBucket(edge)) {
            return edge.expenseAbsorbedAmount === 0 ? (edge.feeAmount ?? 0) : 0;
        }

        if (this.isPrivatbankBucket(edge)) {
            return edge.expenseAbsorbedAmount === 0 ? edge.expenseOriginalMinorAmount : 0;
        }

        return edge.expenseAmount - edge.expenseAbsorbedAmount;
    }

    getMeasure(edge: RefundEdgeRowInterface): number {
        return this.isPrivatbankBucket(edge) ? edge.refundOriginalMinorAmount : edge.refundAmount;
    }

    getShortfall(edge: RefundEdgeRowInterface): number {
        return this.getCapacity(edge) - this.getMeasure(edge);
    }

    isManuallySelectable(edge: RefundEdgeRowInterface): boolean {
        if (this.isPrivatbankBucket(edge)) {
            return edge.expenseAbsorbedAmount === 0;
        }

        return edge.refundAmount <= edge.expenseAmount - edge.expenseAbsorbedAmount;
    }

    isCovering(edge: RefundEdgeRowInterface): boolean {
        return this.getShortfall(edge) >= 0;
    }

    private getTimeDiff(edge: RefundEdgeRowInterface): number {
        return edge.refundOperatedAt - edge.expenseOperatedAt;
    }

    private compareBuckets(left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number {
        return RefundEdgeMetrics.bucketPriority[left.confidenceBucket] - RefundEdgeMetrics.bucketPriority[right.confidenceBucket];
    }

    private compareText(left: string | null, right: string | null): number {
        return Number((left ?? '') > (right ?? '')) - Number((left ?? '') < (right ?? ''));
    }
}

export const refundEdgeMetrics = new RefundEdgeMetrics();

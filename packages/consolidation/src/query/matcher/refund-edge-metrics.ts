import { isDefined } from '@rnw-community/shared';

import { isAutoRefundConfidenceBucket } from '../type-guard/is-auto-refund-confidence-bucket.type-guard';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';
import type { RefundReviewCandidateInterface } from '@budgie/contracts';

class RefundEdgeMetrics {
    private static readonly feeBucket = 'AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE';
    private static readonly decorateSortThreshold = 4;
    private static readonly bucketPriority: Record<RefundReviewCandidateInterface['confidenceBucket'], number> = {
        AUTO_REFUND_EXACT_TITLE: 1,
        AUTO_REFUND_LOCALIZED_REFUND_TITLE: 2,
        AUTO_REFUND_REJECTED_PAYMENT_PRINCIPAL_TITLE: 3,
        AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT: 4,
        AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE: 5,
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

    readonly compareRefundRank = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number => {
        const leftShortfall = this.getShortfall(left);
        const rightShortfall = this.getShortfall(right);

        return (
            Number(leftShortfall !== 0) - Number(rightShortfall !== 0) ||
            Number(leftShortfall < 0) - Number(rightShortfall < 0) ||
            this.compareBuckets(left, right) ||
            Math.abs(leftShortfall) - Math.abs(rightShortfall) ||
            this.getTimeDiff(left) - this.getTimeDiff(right) ||
            this.compareExpenses(left, right)
        );
    };

    readonly compareExpenseRank = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
        Number(this.getShortfall(left) !== 0) - Number(this.getShortfall(right) !== 0) ||
        this.compareBuckets(left, right) ||
        this.getTimeDiff(left) - this.getTimeDiff(right) ||
        this.compareRefunds(left, right);

    readonly isAuto = (edge: RefundEdgeRowInterface): boolean => isAutoRefundConfidenceBucket(edge.confidenceBucket);

    pushGroupedEdge(groups: Map<number, RefundEdgeRowInterface[]>, key: number, edge: RefundEdgeRowInterface): void {
        const group = groups.get(key);

        if (isDefined(group)) {
            group.push(edge);
        } else {
            groups.set(key, [edge]);
        }
    }

    sortRefundEdges(edges: RefundEdgeRowInterface[]): RefundEdgeRowInterface[] {
        if (edges.length <= RefundEdgeMetrics.decorateSortThreshold) {
            return edges.sort(this.compareRefundRank);
        }

        return edges
            .map(edge => {
                const shortfall = this.getShortfall(edge);

                return {
                    edge,
                    isNonExact: Number(shortfall !== 0),
                    isNonCovering: Number(shortfall < 0),
                    bucketPriority: RefundEdgeMetrics.bucketPriority[edge.confidenceBucket],
                    absShortfall: Math.abs(shortfall),
                    timeDiff: edge.refundOperatedAt - edge.expenseOperatedAt
                };
            })
            .sort(
                (left, right) =>
                    left.isNonExact - right.isNonExact ||
                    left.isNonCovering - right.isNonCovering ||
                    left.bucketPriority - right.bucketPriority ||
                    left.absShortfall - right.absShortfall ||
                    left.timeDiff - right.timeDiff ||
                    this.compareExpenses(left.edge, right.edge)
            )
            .map(entry => entry.edge);
    }

    compareBuckets(left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number {
        return RefundEdgeMetrics.bucketPriority[left.confidenceBucket] - RefundEdgeMetrics.bucketPriority[right.confidenceBucket];
    }

    isFeeBucket(edge: RefundEdgeRowInterface): boolean {
        return edge.confidenceBucket === RefundEdgeMetrics.feeBucket;
    }

    isOriginalAmountReversal(edge: RefundEdgeRowInterface): boolean {
        return edge.isPrivatbankOriginalMatch === 1 && !this.isFeeBucket(edge);
    }

    getAbsorbedFeeAmount(edge: RefundEdgeRowInterface): number {
        return Math.min(edge.expenseAbsorbedFeeAmount, edge.feeAmount);
    }

    getAbsorbedPrincipalAmount(edge: RefundEdgeRowInterface): number {
        return edge.expenseAbsorbedAmount - this.getAbsorbedFeeAmount(edge);
    }

    getCapacity(edge: RefundEdgeRowInterface): number {
        if (edge.isExpenseClosed === 1) {
            return 0;
        }

        if (this.isOriginalAmountReversal(edge)) {
            return this.getAbsorbedPrincipalAmount(edge) === 0 ? edge.expenseOriginalMinorAmount : 0;
        }

        if (this.isFeeBucket(edge)) {
            return Math.max(0, edge.feeAmount - this.getAbsorbedFeeAmount(edge));
        }

        return Math.max(0, edge.expenseAmount - this.getAbsorbedPrincipalAmount(edge));
    }

    getMeasure(edge: RefundEdgeRowInterface): number {
        return this.isOriginalAmountReversal(edge) ? edge.refundOriginalMinorAmount : edge.refundAmount;
    }

    getShortfall(edge: RefundEdgeRowInterface): number {
        if (
            edge.isExpenseClosed === 0 &&
            edge.isPrivatbankOriginalMatch !== 1 &&
            edge.confidenceBucket !== RefundEdgeMetrics.feeBucket &&
            edge.expenseAbsorbedAmount === 0 &&
            edge.expenseAbsorbedFeeAmount === 0 &&
            edge.expenseAmount >= 0
        ) {
            return edge.expenseAmount - edge.refundAmount;
        }

        return this.getCapacity(edge) - this.getMeasure(edge);
    }

    isManuallySelectable(edge: RefundEdgeRowInterface): boolean {
        return (
            edge.isExpenseClosed === 0 &&
            (edge.refundAmount <= edge.expenseAmount - edge.expenseAbsorbedAmount ||
                (edge.expenseAbsorbedAmount === 0 && edge.isPrivatbankOriginalMatch === 1))
        );
    }

    isCovering(edge: RefundEdgeRowInterface): boolean {
        return this.getShortfall(edge) >= 0;
    }

    getTimeDiff(edge: RefundEdgeRowInterface): number {
        return edge.refundOperatedAt - edge.expenseOperatedAt;
    }

    private compareText(left: string | null, right: string | null): number {
        const leftText = left ?? '';
        const rightText = right ?? '';

        if (leftText === rightText) {
            return 0;
        }

        return leftText > rightText ? 1 : -1;
    }
}

export const refundEdgeMetrics = new RefundEdgeMetrics();

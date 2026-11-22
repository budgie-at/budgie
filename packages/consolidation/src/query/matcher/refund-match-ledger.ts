import { refundEdgeMetrics } from './refund-edge-metrics';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';

export class RefundMatchLedger {
    private readonly usedByExpenseId = new Map<number, number>();
    private readonly feeUsedByExpenseId = new Map<number, number>();
    private readonly closedExpenseIds = new Set<number>();
    private readonly assignmentByRefundId = new Map<number, RefundEdgeRowInterface>();
    private readonly unsafeRefundIds = new Set<number>();

    get assignments(): RefundEdgeRowInterface[] {
        return [...this.assignmentByRefundId.values()];
    }

    isAssigned(refundTransactionId: number): boolean {
        return this.assignmentByRefundId.has(refundTransactionId);
    }

    isUnsafe(refundTransactionId: number): boolean {
        return this.unsafeRefundIds.has(refundTransactionId);
    }

    markUnsafe(refundTransactionId: number): boolean {
        const isNew = !this.unsafeRefundIds.has(refundTransactionId);

        this.unsafeRefundIds.add(refundTransactionId);

        return isNew;
    }

    isTouched(expenseTransactionId: number): boolean {
        return this.usedByExpenseId.has(expenseTransactionId) || this.closedExpenseIds.has(expenseTransactionId);
    }

    canAssign(edge: RefundEdgeRowInterface): boolean {
        return !this.isAssigned(edge.refundTransactionId) && refundEdgeMetrics.getMeasure(edge) <= this.getRemaining(edge);
    }

    assign(edge: RefundEdgeRowInterface): void {
        this.assignmentByRefundId.set(edge.refundTransactionId, edge);
        this.usedByExpenseId.set(edge.expenseTransactionId, (this.usedByExpenseId.get(edge.expenseTransactionId) ?? 0) + edge.refundAmount);

        if (refundEdgeMetrics.isFeeBucket(edge)) {
            this.feeUsedByExpenseId.set(
                edge.expenseTransactionId,
                (this.feeUsedByExpenseId.get(edge.expenseTransactionId) ?? 0) + edge.refundAmount
            );
        }

        if (refundEdgeMetrics.isOriginalAmountReversal(edge)) {
            this.closedExpenseIds.add(edge.expenseTransactionId);
        }
    }

    getRemaining(edge: RefundEdgeRowInterface): number {
        if (this.closedExpenseIds.has(edge.expenseTransactionId)) {
            return 0;
        }

        if (refundEdgeMetrics.isOriginalAmountReversal(edge)) {
            return this.isTouched(edge.expenseTransactionId) ? 0 : refundEdgeMetrics.getCapacity(edge);
        }

        const feeUsed = refundEdgeMetrics.isFeeBucket(edge) ? (this.feeUsedByExpenseId.get(edge.expenseTransactionId) ?? 0) : 0;

        return Math.min(
            refundEdgeMetrics.getCapacity(edge) - feeUsed,
            refundEdgeMetrics.getOutflow(edge) - edge.expenseAbsorbedAmount - (this.usedByExpenseId.get(edge.expenseTransactionId) ?? 0)
        );
    }
}

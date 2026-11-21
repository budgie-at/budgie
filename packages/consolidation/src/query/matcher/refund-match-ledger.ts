import { refundEdgeMetrics } from './refund-edge-metrics';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';

export class RefundMatchLedger {
    private readonly principalUsed = new Map<number, number>();
    private readonly feeUsed = new Map<number, number>();
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
        return (
            this.principalUsed.has(expenseTransactionId) ||
            this.feeUsed.has(expenseTransactionId) ||
            this.closedExpenseIds.has(expenseTransactionId)
        );
    }

    canAssign(edge: RefundEdgeRowInterface): boolean {
        return !this.isAssigned(edge.refundTransactionId) && refundEdgeMetrics.getMeasure(edge) <= this.getRemaining(edge);
    }

    assign(edge: RefundEdgeRowInterface): void {
        const pool = refundEdgeMetrics.isFeeBucket(edge) ? this.feeUsed : this.principalUsed;

        this.assignmentByRefundId.set(edge.refundTransactionId, edge);
        pool.set(edge.expenseTransactionId, (pool.get(edge.expenseTransactionId) ?? 0) + edge.refundAmount);

        if (refundEdgeMetrics.isPrivatbankBucket(edge)) {
            this.closedExpenseIds.add(edge.expenseTransactionId);
        }
    }

    private getRemaining(edge: RefundEdgeRowInterface): number {
        const capacity = refundEdgeMetrics.getCapacity(edge);

        if (refundEdgeMetrics.isFeeBucket(edge)) {
            return capacity - (this.feeUsed.get(edge.expenseTransactionId) ?? 0);
        }

        if (refundEdgeMetrics.isPrivatbankBucket(edge) || this.closedExpenseIds.has(edge.expenseTransactionId)) {
            return this.isTouched(edge.expenseTransactionId) ? 0 : capacity;
        }

        return capacity - (this.principalUsed.get(edge.expenseTransactionId) ?? 0);
    }
}

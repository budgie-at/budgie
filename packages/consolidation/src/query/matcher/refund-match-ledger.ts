import { isDefined } from '@rnw-community/shared';

import { RemainingFeeRefundPool } from '../../refund/state/remaining-fee-refund-pool';

import { refundEdgeMetrics } from './refund-edge-metrics';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';

export class RefundMatchLedger {
    private readonly principalUsedByExpenseId = new Map<number, number>();
    private readonly feePoolByExpenseId = new Map<number, RemainingFeeRefundPool>();
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
            this.principalUsedByExpenseId.has(expenseTransactionId) ||
            this.feePoolByExpenseId.has(expenseTransactionId) ||
            this.closedExpenseIds.has(expenseTransactionId)
        );
    }

    canAssign(edge: RefundEdgeRowInterface): boolean {
        if (this.isAssigned(edge.refundTransactionId)) {
            return false;
        }

        if (refundEdgeMetrics.isFeeBucket(edge)) {
            if (edge.isExpenseClosed === 1 || this.closedExpenseIds.has(edge.expenseTransactionId)) {
                return false;
            }

            const pool =
                this.feePoolByExpenseId.get(edge.expenseTransactionId) ??
                RemainingFeeRefundPool.fromCsv(edge.feeAmountsCsv, edge.absorbedFeeAmountsCsv);

            return pool.canConsume(edge.refundAmount);
        }

        return refundEdgeMetrics.getMeasure(edge) <= this.getRemaining(edge);
    }

    assign(edge: RefundEdgeRowInterface): void {
        this.assignmentByRefundId.set(edge.refundTransactionId, edge);

        if (refundEdgeMetrics.isFeeBucket(edge)) {
            const existingPool = this.feePoolByExpenseId.get(edge.expenseTransactionId);
            const pool = existingPool ?? RemainingFeeRefundPool.fromCsv(edge.feeAmountsCsv, edge.absorbedFeeAmountsCsv);

            if (!isDefined(existingPool)) {
                this.feePoolByExpenseId.set(edge.expenseTransactionId, pool);
            }

            pool.consume(edge.refundAmount);
        } else {
            this.principalUsedByExpenseId.set(
                edge.expenseTransactionId,
                (this.principalUsedByExpenseId.get(edge.expenseTransactionId) ?? 0) + edge.refundAmount
            );
        }

        if (refundEdgeMetrics.isOriginalAmountReversal(edge)) {
            this.closedExpenseIds.add(edge.expenseTransactionId);
        }
    }

    getRemaining(edge: RefundEdgeRowInterface): number {
        if (edge.isExpenseClosed === 1 || this.closedExpenseIds.has(edge.expenseTransactionId)) {
            return 0;
        }

        if (refundEdgeMetrics.isOriginalAmountReversal(edge)) {
            return this.isPrincipalTouched(edge.expenseTransactionId) ? 0 : refundEdgeMetrics.getCapacity(edge);
        }

        if (refundEdgeMetrics.isFeeBucket(edge)) {
            const pool = this.feePoolByExpenseId.get(edge.expenseTransactionId);

            return isDefined(pool) ? pool.total : refundEdgeMetrics.getCapacity(edge);
        }

        return Math.max(0, refundEdgeMetrics.getCapacity(edge) - (this.principalUsedByExpenseId.get(edge.expenseTransactionId) ?? 0));
    }

    private isPrincipalTouched(expenseTransactionId: number): boolean {
        return this.principalUsedByExpenseId.has(expenseTransactionId) || this.closedExpenseIds.has(expenseTransactionId);
    }
}

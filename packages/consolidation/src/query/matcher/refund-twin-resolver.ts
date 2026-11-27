import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { refundEdgeMetrics } from './refund-edge-metrics';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';

class RefundTwinResolver {
    findBijections(edges: readonly RefundEdgeRowInterface[]): RefundEdgeRowInterface[] {
        if (isEmptyArray(edges)) {
            return [];
        }

        const { edgesByExpenseId, edgesByRefundId } = this.indexEdges(edges);
        const visitedExpenseIds = new Set<number>();
        const bijections: RefundEdgeRowInterface[] = [];

        for (const expenseId of edgesByExpenseId.keys()) {
            if (!visitedExpenseIds.has(expenseId)) {
                bijections.push(...this.resolveComponent(expenseId, edgesByExpenseId, edgesByRefundId, visitedExpenseIds));
            }
        }

        return bijections;
    }

    private indexEdges(edges: readonly RefundEdgeRowInterface[]) {
        const edgesByExpenseId = new Map<number, RefundEdgeRowInterface[]>();
        const edgesByRefundId = new Map<number, RefundEdgeRowInterface[]>();

        for (const edge of edges) {
            refundEdgeMetrics.pushGroupedEdge(edgesByExpenseId, edge.expenseTransactionId, edge);
            refundEdgeMetrics.pushGroupedEdge(edgesByRefundId, edge.refundTransactionId, edge);
        }

        return { edgesByExpenseId, edgesByRefundId };
    }

    private resolveComponent(
        seedExpenseId: number,
        edgesByExpenseId: ReadonlyMap<number, readonly RefundEdgeRowInterface[]>,
        edgesByRefundId: ReadonlyMap<number, readonly RefundEdgeRowInterface[]>,
        visitedExpenseIds: Set<number>
    ): RefundEdgeRowInterface[] {
        const { expenseReps, refundReps } = this.collectComponentReps(seedExpenseId, edgesByExpenseId, edgesByRefundId, visitedExpenseIds);

        if (expenseReps.length !== refundReps.length || !this.areRefundsInterchangeable(refundReps)) {
            return [];
        }

        expenseReps.sort(refundEdgeMetrics.compareExpenses);
        refundReps.sort(refundEdgeMetrics.compareRefunds);

        return this.buildBijectionPairs(expenseReps, refundReps, edgesByExpenseId);
    }

    private collectComponentReps(
        seedExpenseId: number,
        edgesByExpenseId: ReadonlyMap<number, readonly RefundEdgeRowInterface[]>,
        edgesByRefundId: ReadonlyMap<number, readonly RefundEdgeRowInterface[]>,
        visitedExpenseIds: Set<number>
    ) {
        const expenseReps: RefundEdgeRowInterface[] = [];
        const visitedRefundById = new Map<number, RefundEdgeRowInterface>();
        const pendingExpenseIds = [seedExpenseId];
        const pendingRefundIds: number[] = [];

        visitedExpenseIds.add(seedExpenseId);

        while (isNotEmptyArray(pendingExpenseIds)) {
            this.expandExpenseEdges(
                edgesByExpenseId.get(pendingExpenseIds.pop() ?? 0) ?? [],
                expenseReps,
                visitedRefundById,
                pendingRefundIds
            );
            this.expandRefundWave(pendingRefundIds, edgesByRefundId, visitedExpenseIds, pendingExpenseIds);
        }

        return { expenseReps, refundReps: [...visitedRefundById.values()] };
    }

    private expandExpenseEdges(
        expenseEdges: readonly RefundEdgeRowInterface[],
        expenseReps: RefundEdgeRowInterface[],
        visitedRefundById: Map<number, RefundEdgeRowInterface>,
        pendingRefundIds: number[]
    ): void {
        if (isEmptyArray(expenseEdges)) {
            return;
        }

        expenseReps.push(expenseEdges[0]);

        for (const edge of expenseEdges) {
            if (!visitedRefundById.has(edge.refundTransactionId)) {
                visitedRefundById.set(edge.refundTransactionId, edge);
                pendingRefundIds.push(edge.refundTransactionId);
            }
        }
    }

    private areRefundsInterchangeable(refundReps: readonly RefundEdgeRowInterface[]): boolean {
        if (isEmptyArray(refundReps) || !isDefined(refundReps[0].refundBaseAmount)) {
            return false;
        }

        const firstBaseAmount = refundReps[0].refundBaseAmount;

        for (const refund of refundReps) {
            if (refund.refundHasTags !== 0 || refund.refundBaseAmount !== firstBaseAmount) {
                return false;
            }
        }

        return true;
    }

    private buildBijectionPairs(
        expenses: readonly RefundEdgeRowInterface[],
        refunds: readonly RefundEdgeRowInterface[],
        edgesByExpenseId: ReadonlyMap<number, readonly RefundEdgeRowInterface[]>
    ): RefundEdgeRowInterface[] {
        const pairs: RefundEdgeRowInterface[] = [];

        for (let index = 0; index < expenses.length; index += 1) {
            const targetRefundId = refunds[index].refundTransactionId;
            const pairEdge = edgesByExpenseId
                .get(expenses[index].expenseTransactionId)
                ?.find(edge => edge.refundTransactionId === targetRefundId);

            if (!isDefined(pairEdge)) {
                return [];
            }

            pairs.push(pairEdge);
        }

        return pairs;
    }

    private expandRefundWave(
        pendingRefundIds: number[],
        edgesByRefundId: ReadonlyMap<number, readonly RefundEdgeRowInterface[]>,
        visitedExpenseIds: Set<number>,
        pendingExpenseIds: number[]
    ): void {
        while (isNotEmptyArray(pendingRefundIds)) {
            for (const edge of edgesByRefundId.get(pendingRefundIds.pop() ?? 0) ?? []) {
                if (!visitedExpenseIds.has(edge.expenseTransactionId)) {
                    visitedExpenseIds.add(edge.expenseTransactionId);
                    pendingExpenseIds.push(edge.expenseTransactionId);
                }
            }
        }
    }
}

export const refundTwinResolver = new RefundTwinResolver();

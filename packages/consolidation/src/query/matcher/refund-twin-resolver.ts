import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { refundEdgeMetrics } from './refund-edge-metrics';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';

class RefundTwinResolver {
    findComponents(edges: readonly RefundEdgeRowInterface[]): RefundEdgeRowInterface[][] {
        const edgesByNode = new Map<string, RefundEdgeRowInterface[]>();
        const visitedNodes = new Set<string>();

        for (const edge of edges) {
            this.getNodes(edge).forEach(node => edgesByNode.set(node, [...(edgesByNode.get(node) ?? []), edge]));
        }

        return edges.map(edge => this.collectComponent(edge, edgesByNode, visitedNodes)).filter(component => isNotEmptyArray(component));
    }

    findBijection(component: readonly RefundEdgeRowInterface[]): RefundEdgeRowInterface[] {
        const expenses = [...new Map(component.map(edge => [edge.expenseTransactionId, edge])).values()].sort(
            refundEdgeMetrics.compareExpenses
        );
        const refunds = [...new Map(component.map(edge => [edge.refundTransactionId, edge])).values()].sort(
            refundEdgeMetrics.compareRefunds
        );
        const pairs = expenses.map((expense, index) =>
            component.find(
                edge =>
                    edge.expenseTransactionId === expense.expenseTransactionId &&
                    edge.refundTransactionId === refunds.at(index)?.refundTransactionId
            )
        );
        const isInterchangeable = component.every(
            edge => edge.refundHasTags === 0 && isDefined(edge.refundBaseAmount) && edge.refundBaseAmount === component[0].refundBaseAmount
        );

        return expenses.length === refunds.length && isInterchangeable && pairs.every(isDefined) ? pairs.filter(isDefined) : [];
    }

    private collectComponent(
        seedEdge: RefundEdgeRowInterface,
        edgesByNode: ReadonlyMap<string, readonly RefundEdgeRowInterface[]>,
        visitedNodes: Set<string>
    ): RefundEdgeRowInterface[] {
        const componentEdges = new Set<RefundEdgeRowInterface>();
        const pendingNodes = this.getNodes(seedEdge).filter(node => !visitedNodes.has(node));

        while (isNotEmptyArray(pendingNodes)) {
            const node = pendingNodes.pop() ?? '';

            visitedNodes.add(node);
            (edgesByNode.get(node) ?? []).forEach(edge => componentEdges.add(edge));
            pendingNodes.push(...[...componentEdges].flatMap(edge => this.getNodes(edge)).filter(next => !visitedNodes.has(next)));
        }

        return [...componentEdges];
    }

    private getNodes(edge: RefundEdgeRowInterface): string[] {
        return [`e${edge.expenseTransactionId}`, `r${edge.refundTransactionId}`];
    }
}

export const refundTwinResolver = new RefundTwinResolver();

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { refundEdgeMetrics } from './refund-edge-metrics';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';

class RefundTwinResolver {
    findComponents(edges: readonly RefundEdgeRowInterface[]): RefundEdgeRowInterface[][] {
        const edgesByNode = new Map<string, RefundEdgeRowInterface[]>();
        const visitedNodes = new Set<string>();

        for (const edge of edges) {
            for (const node of this.getNodes(edge)) {
                const nodeEdges = edgesByNode.get(node);

                if (isDefined(nodeEdges)) {
                    nodeEdges.push(edge);
                } else {
                    edgesByNode.set(node, [edge]);
                }
            }
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
        const isInterchangeable = component.every(
            edge => edge.refundHasTags === 0 && isDefined(edge.refundBaseAmount) && edge.refundBaseAmount === component[0].refundBaseAmount
        );

        if (expenses.length !== refunds.length || !isInterchangeable) {
            return [];
        }

        const edgeByPair = new Map(component.map(edge => [`${edge.expenseTransactionId}:${edge.refundTransactionId}`, edge]));
        const pairs = expenses.map((expense, index) =>
            edgeByPair.get(`${expense.expenseTransactionId}:${refunds[index].refundTransactionId}`)
        );

        return pairs.every(isDefined) ? pairs.filter(isDefined) : [];
    }

    private collectComponent(
        seedEdge: RefundEdgeRowInterface,
        edgesByNode: ReadonlyMap<string, readonly RefundEdgeRowInterface[]>,
        visitedNodes: Set<string>
    ): RefundEdgeRowInterface[] {
        const componentEdges = new Set<RefundEdgeRowInterface>();
        const pendingNodes = this.getNodes(seedEdge).filter(node => !visitedNodes.has(node));

        pendingNodes.forEach(node => visitedNodes.add(node));

        while (isNotEmptyArray(pendingNodes)) {
            for (const edge of edgesByNode.get(pendingNodes.pop() ?? '') ?? []) {
                componentEdges.add(edge);
                this.getNodes(edge)
                    .filter(next => !visitedNodes.has(next))
                    .forEach(next => {
                        visitedNodes.add(next);
                        pendingNodes.push(next);
                    });
            }
        }

        return [...componentEdges];
    }

    private getNodes(edge: RefundEdgeRowInterface): string[] {
        return [`e${edge.expenseTransactionId}`, `r${edge.refundTransactionId}`];
    }
}

export const refundTwinResolver = new RefundTwinResolver();

import { REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS } from '../constant/refund-manual-review-time-window.constant';

import { refundEdgeMetrics } from './refund-edge-metrics';
import { RefundMatchLedger } from './refund-match-ledger';
import { refundTwinResolver } from './refund-twin-resolver';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';
import type { RefundMatchContextInterface } from '../interface/refund-match-context.interface';
import type { RefundMatchResultInterface } from '../interface/refund-match-result.interface';
import type { RefundMatchWindowInterface } from '../interface/refund-match-window.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

class RefundCandidateMatcher {
    private static readonly uniqueAmountBuckets = new Set<string>([
        'AUTO_REFUND_EXACT_TITLE',
        'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
        'AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT'
    ]);

    private static readonly twinBuckets = new Set<string>(['AUTO_REFUND_EXACT_TITLE', 'AUTO_REFUND_LOCALIZED_REFUND_TITLE']);

    match(rows: readonly RefundEdgeRowInterface[], scope: ConsolidationScanScopeInterface | null): RefundMatchResultInterface {
        const context = this.buildContext(rows, scope);

        this.deferRefundsBeyondLoadedRows(context);
        this.assignForced(context);
        this.assignTwins(context);
        this.assignNearest(context);

        return {
            assignments: context.ledger.assignments.filter(edge => this.isEmitted(context.window, edge)),
            reviewEdges: context.refundEdgeLists
                .filter(edges => !context.ledger.isAssigned(edges[0].refundTransactionId))
                .map(edges => edges.find(edge => refundEdgeMetrics.isManuallySelectable(edge)))
                .filter(isDefined)
        };
    }

    private buildContext(
        rows: readonly RefundEdgeRowInterface[],
        scope: ConsolidationScanScopeInterface | null
    ): RefundMatchContextInterface {
        const refundEdgeLists = this.groupRefundEdges(rows);
        const autoRefundEdgeLists = this.groupRefundEdges(
            rows.filter(edge => edge.isRefundAutoPairDisabled === 0 && refundEdgeMetrics.getCapacity(edge) > 0)
        );
        const expenseEdgeLists = this.groupSorted(
            autoRefundEdgeLists.flat(),
            edge => edge.expenseTransactionId,
            refundEdgeMetrics.compareExpenseRank
        );

        return {
            refundEdgeLists,
            autoRefundEdgeLists,
            refundEdgeListById: new Map(autoRefundEdgeLists.map(edges => [edges[0].refundTransactionId, edges])),
            expenseEdgeLists,
            expenseRanks: new Map([...expenseEdgeLists.values()].flatMap(edges => edges.map((edge, index) => [edge, index + 1] as const))),
            ledger: new RefundMatchLedger(),
            window: isDefined(scope) ? this.buildWindow(scope) : null
        };
    }

    private groupRefundEdges(rows: readonly RefundEdgeRowInterface[]): RefundEdgeRowInterface[][] {
        return [...this.groupSorted(rows, edge => edge.refundTransactionId, refundEdgeMetrics.compareRefundRank).values()].sort(
            (left, right) => refundEdgeMetrics.compareRefunds(left[0], right[0])
        );
    }

    private buildWindow(scope: ConsolidationScanScopeInterface): RefundMatchWindowInterface {
        const scopeFrom = Math.floor(scope.operatedAtFrom.getTime() / 1000);
        const scopeTo = Math.ceil(scope.operatedAtTo.getTime() / 1000);

        return {
            scopeFrom,
            scopeTo,
            loadedFrom: scopeFrom - REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS,
            loadedTo: scopeTo + REFUND_TIME_WINDOW_SECONDS
        };
    }

    private groupSorted(
        edges: readonly RefundEdgeRowInterface[],
        getKey: (edge: RefundEdgeRowInterface) => number,
        compare: (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface) => number
    ): Map<number, RefundEdgeRowInterface[]> {
        const groups = new Map<number, RefundEdgeRowInterface[]>();

        for (const edge of edges) {
            const group = groups.get(getKey(edge));

            if (isDefined(group)) {
                group.push(edge);
            } else {
                groups.set(getKey(edge), [edge]);
            }
        }

        groups.forEach(group => group.sort(compare));

        return groups;
    }

    private getExpenseEdges(context: RefundMatchContextInterface, edge: RefundEdgeRowInterface): readonly RefundEdgeRowInterface[] {
        return context.expenseEdgeLists.get(edge.expenseTransactionId) ?? [];
    }

    private getExpenseRank(context: RefundMatchContextInterface, edge: RefundEdgeRowInterface): number {
        return context.expenseRanks.get(edge) ?? 0;
    }

    private markUnsafe(context: RefundMatchContextInterface, refundTransactionIds: readonly number[]): void {
        const pendingIds = [...refundTransactionIds];

        while (isNotEmptyArray(pendingIds)) {
            const refundTransactionId = pendingIds.pop() ?? 0;

            if (context.ledger.markUnsafe(refundTransactionId)) {
                pendingIds.push(
                    ...(context.refundEdgeListById.get(refundTransactionId) ?? [])
                        .filter(refundEdgeMetrics.isAuto)
                        .flatMap(edge => this.getExpenseEdges(context, edge).map(expenseEdge => expenseEdge.refundTransactionId))
                );
            }
        }
    }

    private deferRefundsBeyondLoadedRows(context: RefundMatchContextInterface): void {
        const { window } = context;

        if (isDefined(window)) {
            this.markUnsafe(
                context,
                context.autoRefundEdgeLists
                    .filter(
                        edges =>
                            edges[0].refundOperatedAt - REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS < window.loadedFrom ||
                            edges.some(
                                edge =>
                                    refundEdgeMetrics.isAuto(edge) && edge.expenseOperatedAt + REFUND_TIME_WINDOW_SECONDS > window.loadedTo
                            )
                    )
                    .map(edges => edges[0].refundTransactionId)
            );
        }
    }

    private isForcedSingle(edges: readonly RefundEdgeRowInterface[]): boolean {
        return edges.every(
            edge =>
                edge === edges[0] ||
                !refundEdgeMetrics.isCovering(edge) ||
                refundEdgeMetrics.getShortfall(edge) > refundEdgeMetrics.getShortfall(edges[0])
        );
    }

    private isUniqueExactAmount(context: RefundMatchContextInterface, edges: readonly RefundEdgeRowInterface[]): boolean {
        const isTopExactAmount = (edge: RefundEdgeRowInterface): boolean =>
            refundEdgeMetrics.getShortfall(edge) === 0 &&
            RefundCandidateMatcher.uniqueAmountBuckets.has(edge.confidenceBucket) &&
            this.getExpenseRank(context, edge) === 1;

        return isTopExactAmount(edges[0]) && edges.filter(isTopExactAmount).length === 1;
    }

    private isResolved(context: RefundMatchContextInterface, edges: readonly RefundEdgeRowInterface[]): boolean {
        return (
            refundEdgeMetrics.isAuto(edges[0]) &&
            refundEdgeMetrics.isCovering(edges[0]) &&
            (this.isForcedSingle(edges) || this.isUniqueExactAmount(context, edges))
        );
    }

    private assignForced(context: RefundMatchContextInterface): void {
        const ambiguousBestEdges = new Set(
            context.autoRefundEdgeLists
                .filter(edges => refundEdgeMetrics.isAuto(edges[0]) && !this.isResolved(context, edges))
                .map(edges => edges[0])
        );
        const isGuarded = (edge: RefundEdgeRowInterface): boolean =>
            this.getExpenseEdges(context, edge)
                .slice(0, this.getExpenseRank(context, edge) - 1)
                .some(betterEdge => ambiguousBestEdges.has(betterEdge));
        const forcedEdges = context.autoRefundEdgeLists
            .filter(edges => !context.ledger.isUnsafe(edges[0].refundTransactionId))
            .filter(edges => this.isResolved(context, edges) && !isGuarded(edges[0]))
            .map(edges => edges[0])
            .sort(
                (left, right) =>
                    left.expenseTransactionId - right.expenseTransactionId ||
                    this.getExpenseRank(context, left) - this.getExpenseRank(context, right)
            );

        for (const edge of forcedEdges) {
            if (context.ledger.canAssign(edge)) {
                context.ledger.assign(edge);
            }
        }
    }

    private assignTwins(context: RefundMatchContextInterface): void {
        const twinComponents = refundTwinResolver.findComponents(
            context.autoRefundEdgeLists
                .filter(
                    edges =>
                        !context.ledger.isAssigned(edges[0].refundTransactionId) && !context.ledger.isUnsafe(edges[0].refundTransactionId)
                )
                .flat()
                .filter(
                    edge =>
                        RefundCandidateMatcher.twinBuckets.has(edge.confidenceBucket) &&
                        edge.expenseAbsorbedAmount === 0 &&
                        edge.expenseAmount === edge.refundAmount &&
                        edge.expenseAutoNormTitle === edge.refundAutoNormTitle &&
                        !context.ledger.isTouched(edge.expenseTransactionId)
                )
        );

        for (const edge of twinComponents.flatMap(component => refundTwinResolver.findBijection(component))) {
            context.ledger.assign(edge);
        }
    }

    private assignNearest(context: RefundMatchContextInterface): void {
        for (const edges of context.autoRefundEdgeLists.filter(list => !context.ledger.isUnsafe(list[0].refundTransactionId))) {
            const nearestEdge = edges
                .filter(edge => refundEdgeMetrics.isAuto(edge) && context.ledger.canAssign(edge))
                .sort(refundEdgeMetrics.compareNearest)
                .at(0);

            if (isDefined(nearestEdge)) {
                context.ledger.assign(nearestEdge);
            }
        }
    }

    private isEmitted(window: RefundMatchWindowInterface | null, edge: RefundEdgeRowInterface): boolean {
        return (
            !isDefined(window) ||
            [edge.refundOperatedAt, edge.expenseOperatedAt].some(
                operatedAt => operatedAt >= window.scopeFrom && operatedAt <= window.scopeTo
            )
        );
    }
}

export const refundCandidateMatcher = new RefundCandidateMatcher();

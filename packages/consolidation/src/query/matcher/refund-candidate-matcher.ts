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

    match(
        rows: readonly RefundEdgeRowInterface[],
        scope: ConsolidationScanScopeInterface | null,
        includeReview = true
    ): RefundMatchResultInterface {
        const context = this.buildContext(rows, scope, includeReview);

        this.deferRefundsBeyondLoadedRows(context);
        this.assignForced(context);
        this.assignTwins(context);
        this.assignNearest(context);

        return {
            assignments: context.ledger.assignments.filter(edge => this.isEmitted(context.window, edge)),
            reviewEdges: includeReview
                ? context.refundEdgeLists
                      .filter(edges => !context.ledger.isAssigned(edges[0].refundTransactionId))
                      .map(edges => edges.find(edge => refundEdgeMetrics.isManuallySelectable(edge)))
                      .filter(isDefined)
                : []
        };
    }

    private buildContext(
        rows: readonly RefundEdgeRowInterface[],
        scope: ConsolidationScanScopeInterface | null,
        includeReview: boolean
    ): RefundMatchContextInterface {
        const refundEdgeLists = includeReview ? this.groupRefundEdges(rows) : [];
        const autoRows = rows.filter(
            edge => edge.isRefundAutoPairDisabled === 0 && refundEdgeMetrics.isAuto(edge) && refundEdgeMetrics.isCovering(edge)
        );
        const autoRefundEdgeLists = this.groupRefundEdges(autoRows);
        const { expenseEdgeLists, bestExpenseEdgeByExpenseId } = this.indexExpenseEdges(autoRows);

        return {
            refundEdgeLists,
            autoRefundEdgeLists,
            refundEdgeListById: new Map(autoRefundEdgeLists.map(edges => [edges[0].refundTransactionId, edges])),
            expenseEdgeLists,
            bestExpenseEdgeByExpenseId,
            ledger: new RefundMatchLedger(),
            window: isDefined(scope) ? this.buildWindow(scope, includeReview) : null
        };
    }

    private indexExpenseEdges(autoRows: readonly RefundEdgeRowInterface[]) {
        const expenseEdgeLists = new Map<number, RefundEdgeRowInterface[]>();
        const bestExpenseEdgeByExpenseId = new Map<number, RefundEdgeRowInterface>();

        for (const edge of autoRows) {
            refundEdgeMetrics.pushGroupedEdge(expenseEdgeLists, edge.expenseTransactionId, edge);
            this.updateBestExpenseEdge(bestExpenseEdgeByExpenseId, edge);
        }

        return { expenseEdgeLists, bestExpenseEdgeByExpenseId };
    }

    private updateBestExpenseEdge(bestByExpenseId: Map<number, RefundEdgeRowInterface>, edge: RefundEdgeRowInterface): void {
        const currentBest = bestByExpenseId.get(edge.expenseTransactionId);

        if (!isDefined(currentBest) || refundEdgeMetrics.compareExpenseRank(edge, currentBest) < 0) {
            bestByExpenseId.set(edge.expenseTransactionId, edge);
        }
    }

    private groupRefundEdges(rows: readonly RefundEdgeRowInterface[]): RefundEdgeRowInterface[][] {
        const groups = new Map<number, RefundEdgeRowInterface[]>();

        for (const edge of rows) {
            refundEdgeMetrics.pushGroupedEdge(groups, edge.refundTransactionId, edge);
        }

        return [...groups.values()]
            .map(group => refundEdgeMetrics.sortRefundEdges(group))
            .sort((left, right) => refundEdgeMetrics.compareRefunds(left[0], right[0]));
    }

    private buildWindow(scope: ConsolidationScanScopeInterface, includeReview: boolean): RefundMatchWindowInterface {
        const scopeFrom = Math.floor(scope.operatedAtFrom.getTime() / 1000);
        const scopeTo = Math.ceil(scope.operatedAtTo.getTime() / 1000);
        const lookbackSeconds = includeReview ? REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS : 2 * REFUND_TIME_WINDOW_SECONDS;

        return { scopeFrom, scopeTo, loadedFrom: scopeFrom - lookbackSeconds, loadedTo: scopeTo + REFUND_TIME_WINDOW_SECONDS };
    }

    private enqueueUnsafeRefund(context: RefundMatchContextInterface, pendingIds: number[], refundTransactionId: number): void {
        if (context.ledger.markUnsafe(refundTransactionId)) {
            pendingIds.push(refundTransactionId);
        }
    }

    private markUnsafe(context: RefundMatchContextInterface, refundTransactionIds: readonly number[]): void {
        const pendingIds: number[] = [];
        const expandedExpenseIds = new Set<number>();

        for (const refundId of refundTransactionIds) {
            this.enqueueUnsafeRefund(context, pendingIds, refundId);
        }

        while (isNotEmptyArray(pendingIds)) {
            for (const edge of context.refundEdgeListById.get(pendingIds.pop() ?? 0) ?? []) {
                if (!expandedExpenseIds.has(edge.expenseTransactionId)) {
                    expandedExpenseIds.add(edge.expenseTransactionId);

                    for (const expenseEdge of context.expenseEdgeLists.get(edge.expenseTransactionId) ?? []) {
                        this.enqueueUnsafeRefund(context, pendingIds, expenseEdge.refundTransactionId);
                    }
                }
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
                            edges[0].refundOperatedAt - REFUND_TIME_WINDOW_SECONDS < window.loadedFrom ||
                            edges.some(edge => edge.expenseOperatedAt + REFUND_TIME_WINDOW_SECONDS > window.loadedTo)
                    )
                    .map(edges => edges[0].refundTransactionId)
            );
        }
    }

    private isForcedSingle(edges: readonly RefundEdgeRowInterface[]): boolean {
        const bestShortfall = refundEdgeMetrics.getShortfall(edges[0]);

        return edges.every((edge, index) => index === 0 || refundEdgeMetrics.getShortfall(edge) > bestShortfall);
    }

    private isUniqueExactAmount(context: RefundMatchContextInterface, edges: readonly RefundEdgeRowInterface[]): boolean {
        return (
            refundEdgeMetrics.getShortfall(edges[0]) === 0 &&
            RefundCandidateMatcher.uniqueAmountBuckets.has(edges[0].confidenceBucket) &&
            context.bestExpenseEdgeByExpenseId.get(edges[0].expenseTransactionId) === edges[0] &&
            (edges.length === 1 || refundEdgeMetrics.getShortfall(edges[1]) !== 0)
        );
    }

    private recordAmbiguousBestEdges(
        edges: readonly RefundEdgeRowInterface[],
        bestAmbiguousEdgeByExpenseId: Map<number, RefundEdgeRowInterface>
    ): void {
        const bestShortfall = refundEdgeMetrics.getShortfall(edges[0]);

        for (const edge of edges) {
            const shortfall = refundEdgeMetrics.getShortfall(edge);

            if (bestShortfall === 0 && shortfall !== 0) {
                break;
            }

            if (shortfall <= bestShortfall) {
                this.updateBestExpenseEdge(bestAmbiguousEdgeByExpenseId, edge);
            }
        }
    }

    private assignForced(context: RefundMatchContextInterface): void {
        const resolvedBestEdges: RefundEdgeRowInterface[] = [];
        const bestAmbiguousEdgeByExpenseId = new Map<number, RefundEdgeRowInterface>();

        for (const edges of context.autoRefundEdgeLists) {
            if (!this.isForcedSingle(edges) && !this.isUniqueExactAmount(context, edges)) {
                this.recordAmbiguousBestEdges(edges, bestAmbiguousEdgeByExpenseId);
            } else if (!context.ledger.isUnsafe(edges[0].refundTransactionId)) {
                resolvedBestEdges.push(edges[0]);
            }
        }

        const forcedEdges = resolvedBestEdges
            .filter(edge => {
                const bestAmbiguous = bestAmbiguousEdgeByExpenseId.get(edge.expenseTransactionId);

                return !isDefined(bestAmbiguous) || refundEdgeMetrics.compareExpenseRank(bestAmbiguous, edge) >= 0;
            })
            .sort(
                (left, right) => left.expenseTransactionId - right.expenseTransactionId || refundEdgeMetrics.compareExpenseRank(left, right)
            );

        for (const edge of forcedEdges) {
            if (context.ledger.canAssign(edge)) {
                context.ledger.assign(edge);
            }
        }
    }

    private isTwinEdge(context: RefundMatchContextInterface, edge: RefundEdgeRowInterface): boolean {
        return (
            RefundCandidateMatcher.twinBuckets.has(edge.confidenceBucket) &&
            edge.expenseAbsorbedAmount === 0 &&
            edge.expenseAmount === edge.refundAmount &&
            edge.expenseAutoNormTitle === edge.refundAutoNormTitle &&
            !context.ledger.isTouched(edge.expenseTransactionId)
        );
    }

    private assignTwins(context: RefundMatchContextInterface): void {
        const twinEdges: RefundEdgeRowInterface[] = [];

        for (const edges of context.autoRefundEdgeLists) {
            if (!context.ledger.isAssigned(edges[0].refundTransactionId) && !context.ledger.isUnsafe(edges[0].refundTransactionId)) {
                for (const edge of edges) {
                    if (this.isTwinEdge(context, edge)) {
                        twinEdges.push(edge);
                    }
                }
            }
        }

        for (const edge of refundTwinResolver.findBijections(twinEdges)) {
            context.ledger.assign(edge);
        }
    }

    private assignNearest(context: RefundMatchContextInterface): void {
        for (const edges of context.autoRefundEdgeLists) {
            const [{ refundTransactionId }] = edges;

            if (!context.ledger.isUnsafe(refundTransactionId) && !context.ledger.isAssigned(refundTransactionId)) {
                const nearestEdge = edges.reduce<RefundEdgeRowInterface | null>((best, edge) => {
                    if (!context.ledger.canAssign(edge)) {
                        return best;
                    }

                    return !isDefined(best) || this.compareNearest(context, edge, best) < 0 ? edge : best;
                }, null);

                if (isDefined(nearestEdge)) {
                    context.ledger.assign(nearestEdge);
                }
            }
        }
    }

    private compareNearest(context: RefundMatchContextInterface, left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number {
        const leftGap = context.ledger.getRemaining(left) - refundEdgeMetrics.getMeasure(left);
        const rightGap = context.ledger.getRemaining(right) - refundEdgeMetrics.getMeasure(right);

        return (
            Number(leftGap !== 0) - Number(rightGap !== 0) ||
            refundEdgeMetrics.compareBuckets(left, right) ||
            refundEdgeMetrics.getTimeDiff(left) - refundEdgeMetrics.getTimeDiff(right) ||
            leftGap - rightGap ||
            refundEdgeMetrics.compareExpenses(left, right)
        );
    }

    private isEmitted(window: RefundMatchWindowInterface | null, edge: RefundEdgeRowInterface): boolean {
        return (
            !isDefined(window) ||
            (edge.refundOperatedAt >= window.scopeFrom && edge.refundOperatedAt <= window.scopeTo) ||
            (edge.expenseOperatedAt >= window.scopeFrom && edge.expenseOperatedAt <= window.scopeTo)
        );
    }
}

export const refundCandidateMatcher = new RefundCandidateMatcher();

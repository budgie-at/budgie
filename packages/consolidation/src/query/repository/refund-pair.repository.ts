/* eslint-disable max-lines -- File owns a single multi-stage refund pipeline (SQL edges plus the matcher) that must stay together */
import { Db, REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS } from '../constant/refund-manual-review-time-window.constant';
import { isAutoRefundConfidenceBucket } from '../type-guard/is-auto-refund-confidence-bucket.type-guard';

import { buildRefundEdgeSql } from './sql-factory/refund-ranked-candidate-sql.factory';
import {
    REFUNDABLE_EXPENSE_CANDIDATES_SQL,
    buildRefundableExpenseCandidateParams
} from './sql-factory/refundable-expense-candidate-sql.factory';

import type { RefundEdgeRowInterface } from '../interface/refund-edge-row.interface';
import type {
    ConsolidationScanScopeInterface,
    LanguageEnum,
    RefundAutoConfidenceBucket,
    RefundCandidateInterface,
    RefundReviewCandidateInterface,
    RefundableExpenseCandidateInterface,
    RefundableExpenseCandidateRowInterface
} from '@budgie/contracts';

export class RefundPairRepository extends Context.Service<RefundPairRepository>()('@budgie/consolidation/RefundPairRepository', {
    make: Effect.sync(() => {
        const feeBucket = 'AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE';
        const privatbankBucket = 'AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT';
        const bucketPriority: Record<RefundReviewCandidateInterface['confidenceBucket'], number> = {
            AUTO_REFUND_EXACT_TITLE: 1,
            AUTO_REFUND_LOCALIZED_REFUND_TITLE: 2,
            AUTO_REFUND_REJECTED_PAYMENT_PRINCIPAL_TITLE: 3,
            AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE: 4,
            AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT: 5,
            REVIEW_REFUND_PREFIX_TITLE_MCC: 6
        };
        const uniqueAmountBuckets = new Set<string>(['AUTO_REFUND_EXACT_TITLE', 'AUTO_REFUND_LOCALIZED_REFUND_TITLE', privatbankBucket]);
        const twinBuckets = new Set<string>(['AUTO_REFUND_EXACT_TITLE', 'AUTO_REFUND_LOCALIZED_REFUND_TITLE']);

        const getCapacity = (edge: RefundEdgeRowInterface): number => {
            if (edge.confidenceBucket === feeBucket) {
                return edge.expenseAbsorbedAmount === 0 ? (edge.feeAmount ?? 0) : 0;
            }

            if (edge.confidenceBucket === privatbankBucket) {
                return edge.expenseAbsorbedAmount === 0 ? edge.expenseOriginalMinorAmount : 0;
            }

            return edge.expenseAmount - edge.expenseAbsorbedAmount;
        };
        const getMeasure = (edge: RefundEdgeRowInterface): number =>
            edge.confidenceBucket === privatbankBucket ? edge.refundOriginalMinorAmount : edge.refundAmount;
        const getShortfall = (edge: RefundEdgeRowInterface): number => getCapacity(edge) - getMeasure(edge);
        const isCovering = (edge: RefundEdgeRowInterface): boolean => getShortfall(edge) >= 0;
        const isAuto = (edge: RefundEdgeRowInterface): boolean => isAutoRefundConfidenceBucket(edge.confidenceBucket);
        const getTimeDiff = (edge: RefundEdgeRowInterface): number => edge.refundOperatedAt - edge.expenseOperatedAt;
        const compareText = (left: string | null, right: string | null): number =>
            Number((left ?? '') > (right ?? '')) - Number((left ?? '') < (right ?? ''));
        const compareRefunds = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
            left.refundOperatedAt - right.refundOperatedAt ||
            compareText(left.refundSyncId, right.refundSyncId) ||
            left.refundTransactionId - right.refundTransactionId;
        const compareExpenses = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
            left.expenseOperatedAt - right.expenseOperatedAt ||
            compareText(left.expenseSyncId, right.expenseSyncId) ||
            left.expenseTransactionId - right.expenseTransactionId;
        const compareRefundRank = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
            Number(getShortfall(left) !== 0) - Number(getShortfall(right) !== 0) ||
            Number(!isCovering(left)) - Number(!isCovering(right)) ||
            bucketPriority[left.confidenceBucket] - bucketPriority[right.confidenceBucket] ||
            Math.abs(getShortfall(left)) - Math.abs(getShortfall(right)) ||
            getTimeDiff(left) - getTimeDiff(right) ||
            compareExpenses(left, right);
        const compareExpenseRank = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
            Number(getShortfall(left) !== 0) - Number(getShortfall(right) !== 0) ||
            bucketPriority[left.confidenceBucket] - bucketPriority[right.confidenceBucket] ||
            getTimeDiff(left) - getTimeDiff(right) ||
            compareRefunds(left, right);
        const isExactAmount = (edge: RefundEdgeRowInterface): boolean =>
            edge.confidenceBucket === privatbankBucket
                ? edge.refundOriginalMinorAmount === edge.expenseOriginalMinorAmount
                : edge.refundAmount === edge.expenseAmount;
        const compareNearest = (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface): number =>
            Number(!isExactAmount(left)) - Number(!isExactAmount(right)) ||
            getTimeDiff(left) - getTimeDiff(right) ||
            Math.abs(left.expenseAmount - left.refundAmount) - Math.abs(right.expenseAmount - right.refundAmount) ||
            compareExpenses(left, right);

        const groupSorted = (
            edges: readonly RefundEdgeRowInterface[],
            getKey: (edge: RefundEdgeRowInterface) => number,
            compare: (left: RefundEdgeRowInterface, right: RefundEdgeRowInterface) => number
        ): Map<number, RefundEdgeRowInterface[]> => {
            const groups = new Map<number, RefundEdgeRowInterface[]>();

            for (const edge of edges) {
                groups.set(getKey(edge), [...(groups.get(getKey(edge)) ?? []), edge]);
            }

            return new Map([...groups].map(([key, group]) => [key, group.sort(compare)]));
        };

        const findTwinComponents = (edges: readonly RefundEdgeRowInterface[]): RefundEdgeRowInterface[][] => {
            const edgesByNode = new Map<string, RefundEdgeRowInterface[]>();
            const visitedNodes = new Set<string>();
            const getNodes = (edge: RefundEdgeRowInterface): string[] => [`e${edge.expenseTransactionId}`, `r${edge.refundTransactionId}`];

            for (const edge of edges) {
                getNodes(edge).forEach(node => edgesByNode.set(node, [...(edgesByNode.get(node) ?? []), edge]));
            }

            return edges.flatMap(seedEdge => {
                const componentEdges = new Set<RefundEdgeRowInterface>();
                const pendingNodes = getNodes(seedEdge).filter(node => !visitedNodes.has(node));

                while (isNotEmptyArray(pendingNodes)) {
                    const node = pendingNodes.pop() ?? '';

                    visitedNodes.add(node);
                    (edgesByNode.get(node) ?? []).forEach(edge => componentEdges.add(edge));
                    pendingNodes.push(...[...componentEdges].flatMap(getNodes).filter(next => !visitedNodes.has(next)));
                }

                return isNotEmptyArray([...componentEdges]) ? [[...componentEdges]] : [];
            });
        };

        const findTwinBijection = (component: readonly RefundEdgeRowInterface[]): RefundEdgeRowInterface[] => {
            const expenses = [...new Map(component.map(edge => [edge.expenseTransactionId, edge])).values()].sort(compareExpenses);
            const refunds = [...new Map(component.map(edge => [edge.refundTransactionId, edge])).values()].sort(compareRefunds);
            const pairs = expenses.map((expense, index) =>
                component.find(
                    edge =>
                        edge.expenseTransactionId === expense.expenseTransactionId &&
                        edge.refundTransactionId === refunds.at(index)?.refundTransactionId
                )
            );
            const isInterchangeable = component.every(
                edge =>
                    edge.refundHasTags === 0 && isDefined(edge.refundBaseAmount) && edge.refundBaseAmount === component[0].refundBaseAmount
            );

            return expenses.length === refunds.length && isInterchangeable && pairs.every(isDefined) ? pairs.filter(isDefined) : [];
        };

        const matchRefundEdges = (rows: readonly RefundEdgeRowInterface[], scope: ConsolidationScanScopeInterface | null) => {
            const refundEdgeLists = [
                ...groupSorted(
                    rows.filter(edge => getCapacity(edge) > 0),
                    edge => edge.refundTransactionId,
                    compareRefundRank
                ).values()
            ].sort((left, right) => compareRefunds(left[0], right[0]));
            const autoRefundEdgeLists = refundEdgeLists.filter(edges => edges[0].isRefundAutoPairDisabled === 0);
            const refundEdgeListById = new Map(autoRefundEdgeLists.map(edges => [edges[0].refundTransactionId, edges]));
            const expenseEdgeLists = groupSorted(autoRefundEdgeLists.flat(), edge => edge.expenseTransactionId, compareExpenseRank);
            const getExpenseEdges = (edge: RefundEdgeRowInterface): RefundEdgeRowInterface[] =>
                expenseEdgeLists.get(edge.expenseTransactionId) ?? [];
            const expenseRanks = new Map(
                [...expenseEdgeLists.values()].flatMap(edges => edges.map((edge, index) => [edge, index + 1] as const))
            );
            const getExpenseRank = (edge: RefundEdgeRowInterface): number => expenseRanks.get(edge) ?? 0;
            const principalUsed = new Map<number, number>();
            const feeUsed = new Map<number, number>();
            const closedExpenseIds = new Set<number>();
            const assignments = new Map<number, RefundEdgeRowInterface>();
            const unsafeRefundIds = new Set<number>();
            const scopeFrom = isDefined(scope) ? Math.floor(scope.operatedAtFrom.getTime() / 1000) : 0;
            const scopeTo = isDefined(scope) ? Math.ceil(scope.operatedAtTo.getTime() / 1000) : 0;
            const loadedFrom = scopeFrom - REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS;
            const loadedTo = scopeTo + REFUND_TIME_WINDOW_SECONDS;

            const isTouched = (expenseTransactionId: number): boolean =>
                principalUsed.has(expenseTransactionId) || feeUsed.has(expenseTransactionId) || closedExpenseIds.has(expenseTransactionId);
            const getRemaining = (edge: RefundEdgeRowInterface): number => {
                if (edge.confidenceBucket === feeBucket) {
                    return getCapacity(edge) - (feeUsed.get(edge.expenseTransactionId) ?? 0);
                }

                if (edge.confidenceBucket === privatbankBucket || closedExpenseIds.has(edge.expenseTransactionId)) {
                    return isTouched(edge.expenseTransactionId) ? 0 : getCapacity(edge);
                }

                return getCapacity(edge) - (principalUsed.get(edge.expenseTransactionId) ?? 0);
            };
            const canAssign = (edge: RefundEdgeRowInterface): boolean =>
                !assignments.has(edge.refundTransactionId) && getMeasure(edge) <= getRemaining(edge);
            const assign = (edge: RefundEdgeRowInterface): void => {
                const pool = edge.confidenceBucket === feeBucket ? feeUsed : principalUsed;

                assignments.set(edge.refundTransactionId, edge);
                pool.set(edge.expenseTransactionId, (pool.get(edge.expenseTransactionId) ?? 0) + edge.refundAmount);

                if (edge.confidenceBucket === privatbankBucket) {
                    closedExpenseIds.add(edge.expenseTransactionId);
                }
            };
            const markUnsafe = (refundTransactionIds: readonly number[]): void => {
                const pendingIds = [...refundTransactionIds];

                while (isNotEmptyArray(pendingIds)) {
                    const refundTransactionId = pendingIds.pop() ?? 0;

                    if (!unsafeRefundIds.has(refundTransactionId)) {
                        unsafeRefundIds.add(refundTransactionId);
                        pendingIds.push(
                            ...(refundEdgeListById.get(refundTransactionId) ?? [])
                                .filter(isAuto)
                                .flatMap(edge => getExpenseEdges(edge).map(expenseEdge => expenseEdge.refundTransactionId))
                        );
                    }
                }
            };

            if (isDefined(scope)) {
                markUnsafe(
                    autoRefundEdgeLists
                        .filter(edges => edges[0].refundOperatedAt - REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS < loadedFrom)
                        .map(edges => edges[0].refundTransactionId)
                );
            }

            const isForcedSingle = (edges: readonly RefundEdgeRowInterface[]): boolean =>
                edges.every(edge => edge === edges[0] || !isCovering(edge) || getShortfall(edge) > getShortfall(edges[0]));
            const isUniqueExactAmount = (edges: readonly RefundEdgeRowInterface[]): boolean =>
                getShortfall(edges[0]) === 0 &&
                getExpenseRank(edges[0]) === 1 &&
                edges.filter(
                    edge => getShortfall(edge) === 0 && uniqueAmountBuckets.has(edge.confidenceBucket) && getExpenseRank(edge) === 1
                ).length === 1 &&
                uniqueAmountBuckets.has(edges[0].confidenceBucket);
            const isResolved = (edges: readonly RefundEdgeRowInterface[]): boolean =>
                isAuto(edges[0]) && isCovering(edges[0]) && (isForcedSingle(edges) || isUniqueExactAmount(edges));
            const ambiguousBestEdges = new Set(
                autoRefundEdgeLists.filter(edges => isAuto(edges[0]) && !isResolved(edges)).map(edges => edges[0])
            );
            const isGuarded = (edge: RefundEdgeRowInterface): boolean =>
                getExpenseEdges(edge)
                    .slice(0, getExpenseRank(edge) - 1)
                    .some(betterEdge => ambiguousBestEdges.has(betterEdge));
            const safeRefundEdgeLists = autoRefundEdgeLists.filter(edges => !unsafeRefundIds.has(edges[0].refundTransactionId));

            const forcedEdges = safeRefundEdgeLists
                .filter(edges => isResolved(edges) && !isGuarded(edges[0]))
                .map(edges => edges[0])
                .sort(
                    (left, right) => left.expenseTransactionId - right.expenseTransactionId || getExpenseRank(left) - getExpenseRank(right)
                );

            for (const edge of forcedEdges) {
                if (canAssign(edge)) {
                    assign(edge);
                }
            }

            const twinComponents = findTwinComponents(
                autoRefundEdgeLists
                    .filter(edges => !assignments.has(edges[0].refundTransactionId))
                    .flat()
                    .filter(
                        edge =>
                            twinBuckets.has(edge.confidenceBucket) &&
                            edge.expenseAbsorbedAmount === 0 &&
                            edge.expenseAmount === edge.refundAmount &&
                            edge.expenseAutoNormTitle === edge.refundAutoNormTitle &&
                            !isTouched(edge.expenseTransactionId)
                    )
            );
            const isNearLoadedBoundary = (component: readonly RefundEdgeRowInterface[]): boolean =>
                isDefined(scope) &&
                component.some(
                    edge =>
                        edge.expenseOperatedAt > loadedTo - REFUND_TIME_WINDOW_SECONDS ||
                        edge.refundOperatedAt < loadedFrom + REFUND_TIME_WINDOW_SECONDS ||
                        unsafeRefundIds.has(edge.refundTransactionId)
                );

            markUnsafe(twinComponents.filter(isNearLoadedBoundary).flatMap(component => component.map(edge => edge.refundTransactionId)));
            twinComponents
                .filter(component => !isNearLoadedBoundary(component))
                .flatMap(findTwinBijection)
                .forEach(assign);

            for (const edges of autoRefundEdgeLists.filter(list => !unsafeRefundIds.has(list[0].refundTransactionId))) {
                const nearestEdge = edges
                    .filter(edge => isAuto(edge) && canAssign(edge))
                    .sort(compareNearest)
                    .at(0);

                if (isDefined(nearestEdge)) {
                    assign(nearestEdge);
                }
            }

            return {
                assignments: [...assignments.values()].filter(
                    edge =>
                        !isDefined(scope) ||
                        [edge.refundOperatedAt, edge.expenseOperatedAt].some(operatedAt => operatedAt >= scopeFrom && operatedAt <= scopeTo)
                ),
                reviewEdges: refundEdgeLists
                    .filter(edges => !assignments.has(edges[0].refundTransactionId) && isCovering(edges[0]))
                    .map(edges => edges[0])
            };
        };

        const autoMatchTypes: Record<RefundAutoConfidenceBucket, RefundCandidateInterface['matchType']> = {
            AUTO_REFUND_EXACT_TITLE: 'exact-title',
            AUTO_REFUND_LOCALIZED_REFUND_TITLE: 'localized-refund-title',
            AUTO_REFUND_REJECTED_PAYMENT_PRINCIPAL_TITLE: 'rejected-payment-principal-title',
            AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE: 'rejected-payment-fee-title',
            AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT: 'privatbank-original-amount'
        };
        const findEdges = (scope: ConsolidationScanScopeInterface | null) =>
            Db.query(db =>
                db.$client.unsafe<RefundEdgeRowInterface>(
                    buildRefundEdgeSql(
                        isDefined(scope)
                            ? {
                                  ...scope,
                                  operatedAtFrom: new Date(
                                      scope.operatedAtFrom.getTime() - REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS * 1000
                                  ),
                                  operatedAtTo: new Date(scope.operatedAtTo.getTime() + REFUND_TIME_WINDOW_SECONDS * 1000)
                              }
                            : null
                    )
                )
            );

        const mapRefundableExpenseCandidateRow = (row: RefundableExpenseCandidateRowInterface): RefundableExpenseCandidateInterface => ({
            id: row.id,
            type: row.type,
            title: row.title,
            comment: row.comment,
            operatedAt: new Date(row.operatedAtMs),
            amount: row.amount,
            accountTitle: row.accountTitle,
            currencyCode: row.currencyCode,
            currencySymbol: row.currencySymbol,
            categoryTitle: row.categoryTitle,
            categoryTitleEn: row.categoryTitleEn,
            categoryIcon: row.categoryIcon,
            isRecommended: row.isRecommended === 1
        });

        return {
            findCandidates: Effect.fn('RefundPairRepository.findCandidates')(function* (
                scope: ConsolidationScanScopeInterface | null = null
            ) {
                const edges = yield* findEdges(scope);
                const { assignments } = matchRefundEdges(edges, scope);
                const candidates = new Map<string, RefundCandidateInterface>();

                for (const edge of assignments) {
                    const bucket = edge.confidenceBucket;
                    const key = `${edge.expenseTransactionId}:${bucket}`;
                    const existing = candidates.get(key);

                    if (isAutoRefundConfidenceBucket(bucket)) {
                        candidates.set(key, {
                            accountId: edge.accountId,
                            confidenceBucket: bucket,
                            expenseEntryAmount: edge.expenseAmount,
                            expenseTransactionId: edge.expenseTransactionId,
                            matchType: autoMatchTypes[bucket],
                            refundIncomeTransactionIds: [...(existing?.refundIncomeTransactionIds ?? []), edge.refundTransactionId].sort(
                                (left, right) => left - right
                            ),
                            refundsTotal: (existing?.refundsTotal ?? 0) + edge.refundAmount
                        });
                    }
                }

                return [...candidates.values()].sort((left, right) => left.expenseTransactionId - right.expenseTransactionId);
            }),
            findReviewCandidates: Effect.fn('RefundPairRepository.findReviewCandidates')(function* () {
                const edges = yield* findEdges(null);
                const { reviewEdges } = matchRefundEdges(edges, null);

                return reviewEdges.map((edge): RefundReviewCandidateInterface => ({
                    accountId: edge.accountId,
                    confidenceBucket: edge.confidenceBucket,
                    expenseEntryAmount: edge.expenseAmount,
                    expenseTransactionId: edge.expenseTransactionId,
                    matchType: edge.matchType,
                    refundIncomeTransactionIds: [edge.refundTransactionId],
                    refundsTotal: edge.refundAmount
                }));
            }),
            findRefundableExpenseCandidates: Effect.fn('RefundPairRepository.findRefundableExpenseCandidates')(function* (
                refundIncomeTransactionId: number,
                search: string,
                language: LanguageEnum
            ) {
                const searchPattern = `%${search.trim().toLowerCase()}%`;
                const rows = yield* Db.query(db =>
                    db.$client.unsafe<RefundableExpenseCandidateRowInterface>(
                        REFUNDABLE_EXPENSE_CANDIDATES_SQL,
                        buildRefundableExpenseCandidateParams(refundIncomeTransactionId, searchPattern, language)
                    )
                );

                return rows.map(row => mapRefundableExpenseCandidateRow(row));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(RefundPairRepository, RefundPairRepository.make);
}

import { Db, REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS } from '../constant/refund-manual-review-time-window.constant';
import { refundCandidateMatcher } from '../matcher/refund-candidate-matcher';
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
                const { assignments } = refundCandidateMatcher.match(edges, scope);
                const candidates = new Map<string, RefundCandidateInterface>();

                for (const edge of assignments) {
                    const bucket = edge.confidenceBucket;
                    const key = `${edge.expenseTransactionId}:${bucket}`;
                    const existing = candidates.get(key);

                    if (isDefined(existing)) {
                        existing.refundIncomeTransactionIds.push(edge.refundTransactionId);
                        candidates.set(key, { ...existing, refundsTotal: existing.refundsTotal + edge.refundAmount });
                    } else if (isAutoRefundConfidenceBucket(bucket)) {
                        candidates.set(key, {
                            accountId: edge.accountId,
                            confidenceBucket: bucket,
                            expenseEntryAmount: edge.expenseAmount,
                            expenseTransactionId: edge.expenseTransactionId,
                            matchType: autoMatchTypes[bucket],
                            refundIncomeTransactionIds: [edge.refundTransactionId],
                            refundsTotal: edge.refundAmount
                        });
                    }
                }

                return [...candidates.values()]
                    .map(candidate => ({
                        ...candidate,
                        refundIncomeTransactionIds: candidate.refundIncomeTransactionIds.sort((left, right) => left - right)
                    }))
                    .sort((left, right) => left.expenseTransactionId - right.expenseTransactionId);
            }),
            findReviewCandidates: Effect.fn('RefundPairRepository.findReviewCandidates')(function* () {
                const edges = yield* findEdges(null);
                const { reviewEdges } = refundCandidateMatcher.match(edges, null);

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

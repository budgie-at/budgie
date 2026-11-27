import { Db, REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS } from '../constant/refund-manual-review-time-window.constant';
import { refundCandidateMatcher } from '../matcher/refund-candidate-matcher';
import { isAutoRefundConfidenceBucket } from '../type-guard/is-auto-refund-confidence-bucket.type-guard';

import { buildRefundEdgeSql } from './sql-factory/refund-ranked-candidate-sql.factory';
import {
    REFUNDABLE_EXPENSE_CANDIDATES_LIMIT,
    REFUNDABLE_EXPENSE_CANDIDATES_UNFILTERED_SQL,
    buildRefundableExpenseCandidateSearchParams,
    buildRefundableExpenseCandidateUnfilteredParams,
    buildRefundableExpenseCandidatesSearchSql
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
        const maxAsciiCode = 127;
        const autoMatchTypes: Record<RefundAutoConfidenceBucket, RefundCandidateInterface['matchType']> = {
            AUTO_REFUND_EXACT_TITLE: 'exact-title',
            AUTO_REFUND_LOCALIZED_REFUND_TITLE: 'localized-refund-title',
            AUTO_REFUND_REJECTED_PAYMENT_PRINCIPAL_TITLE: 'rejected-payment-principal-title',
            AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE: 'rejected-payment-fee-title',
            AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT: 'privatbank-original-amount'
        };
        const reviewMatchTypes: Record<RefundReviewCandidateInterface['confidenceBucket'], RefundReviewCandidateInterface['matchType']> = {
            ...autoMatchTypes,
            REVIEW_REFUND_PREFIX_TITLE_MCC: 'prefix-title-mcc'
        };
        const refundableExpenseCandidatesAsciiSearchSql = buildRefundableExpenseCandidatesSearchSql(true);
        const refundableExpenseCandidatesUnicodeSearchSql = buildRefundableExpenseCandidatesSearchSql(false);

        const isAsciiOnly = (value: string): boolean => {
            for (let index = 0; index < value.length; index += 1) {
                if (value.charCodeAt(index) > maxAsciiCode) {
                    return false;
                }
            }

            return true;
        };

        const escapeLikePattern = (value: string): string => value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

        const matchesSearchQuery = (row: RefundableExpenseCandidateRowInterface, normalizedSearch: string): boolean =>
            row.title.toLowerCase().includes(normalizedSearch) ||
            row.comment.toLowerCase().includes(normalizedSearch) ||
            row.accountTitle.toLowerCase().includes(normalizedSearch) ||
            (row.categoryTitle ?? '').toLowerCase().includes(normalizedSearch) ||
            (row.categoryTitleEn ?? '').toLowerCase().includes(normalizedSearch);

        const findEdges = (scope: ConsolidationScanScopeInterface | null, includeReview: boolean) => {
            const lookbackSeconds = includeReview ? REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS : 2 * REFUND_TIME_WINDOW_SECONDS;

            return Db.query(db =>
                db.$client.unsafe<RefundEdgeRowInterface>(
                    buildRefundEdgeSql(
                        isDefined(scope)
                            ? {
                                  ...scope,
                                  operatedAtFrom: new Date(scope.operatedAtFrom.getTime() - lookbackSeconds * 1000),
                                  operatedAtTo: new Date(scope.operatedAtTo.getTime() + REFUND_TIME_WINDOW_SECONDS * 1000)
                              }
                            : null,
                        includeReview
                    )
                )
            );
        };

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
                const edges = yield* findEdges(scope, false);
                const { assignments } = refundCandidateMatcher.match(edges, scope, false);
                const candidates = new Map<string, RefundCandidateInterface>();

                for (const edge of assignments) {
                    const bucket = edge.confidenceBucket;
                    const key = `${edge.expenseTransactionId}:${bucket}`;
                    const existing = candidates.get(key);

                    if (isDefined(existing)) {
                        candidates.set(key, {
                            ...existing,
                            refundIncomeTransactionIds: [...existing.refundIncomeTransactionIds, edge.refundTransactionId],
                            refundsTotal: existing.refundsTotal + edge.refundAmount
                        });
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
                        refundIncomeTransactionIds: [...candidate.refundIncomeTransactionIds].sort((left, right) => left - right)
                    }))
                    .sort(
                        (left, right) =>
                            left.expenseTransactionId - right.expenseTransactionId ||
                            Number(left.confidenceBucket > right.confidenceBucket) - Number(left.confidenceBucket < right.confidenceBucket)
                    );
            }),
            findReviewCandidates: Effect.fn('RefundPairRepository.findReviewCandidates')(function* () {
                const edges = yield* findEdges(null, true);
                const { reviewEdges } = refundCandidateMatcher.match(edges, null, true);

                return reviewEdges.map((edge): RefundReviewCandidateInterface => ({
                    accountId: edge.accountId,
                    confidenceBucket: edge.confidenceBucket,
                    expenseEntryAmount: edge.expenseAmount,
                    expenseTransactionId: edge.expenseTransactionId,
                    matchType: reviewMatchTypes[edge.confidenceBucket],
                    refundIncomeTransactionIds: [edge.refundTransactionId],
                    refundsTotal: edge.refundAmount
                }));
            }),
            findRefundableExpenseCandidates: Effect.fn('RefundPairRepository.findRefundableExpenseCandidates')(function* (
                refundIncomeTransactionId: number,
                search: string,
                language: LanguageEnum
            ) {
                const trimmedSearch = search.trim();

                if (!isNotEmptyString(trimmedSearch)) {
                    const rows = yield* Db.query(db =>
                        db.$client.unsafe<RefundableExpenseCandidateRowInterface>(
                            REFUNDABLE_EXPENSE_CANDIDATES_UNFILTERED_SQL,
                            buildRefundableExpenseCandidateUnfilteredParams(refundIncomeTransactionId, language)
                        )
                    );

                    return rows.map(row => mapRefundableExpenseCandidateRow(row));
                }

                const normalizedSearch = trimmedSearch.toLowerCase();

                if (isAsciiOnly(trimmedSearch)) {
                    const escapedAsciiSearchPattern = `%${escapeLikePattern(normalizedSearch)}%`;
                    const rows = yield* Db.query(db =>
                        db.$client.unsafe<RefundableExpenseCandidateRowInterface>(
                            refundableExpenseCandidatesAsciiSearchSql,
                            buildRefundableExpenseCandidateSearchParams(refundIncomeTransactionId, language, escapedAsciiSearchPattern)
                        )
                    );

                    return rows.map(row => mapRefundableExpenseCandidateRow(row));
                }

                const rows = yield* Db.query(db =>
                    db.$client.unsafe<RefundableExpenseCandidateRowInterface>(
                        refundableExpenseCandidatesUnicodeSearchSql,
                        buildRefundableExpenseCandidateSearchParams(refundIncomeTransactionId, language, null)
                    )
                );

                return rows
                    .filter(row => matchesSearchQuery(row, normalizedSearch))
                    .slice(0, REFUNDABLE_EXPENSE_CANDIDATES_LIMIT)
                    .map(row => mapRefundableExpenseCandidateRow(row));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(RefundPairRepository, RefundPairRepository.make);
}

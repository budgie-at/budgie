import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { REFUND_AUTO_CANDIDATES_SQL, REFUND_REVIEW_CANDIDATES_SQL } from './sql-factory/refund-ranked-candidate-sql.factory';
import {
    REFUNDABLE_EXPENSE_CANDIDATES_SQL,
    buildRefundableExpenseCandidateParams
} from './sql-factory/refundable-expense-candidate-sql.factory';

import type {
    ConsolidationScanScopeInterface,
    LanguageEnum,
    RefundCandidateBaseInterface,
    RefundCandidateBaseRowInterface,
    RefundCandidateInterface,
    RefundCandidateRowInterface,
    RefundReviewCandidateInterface,
    RefundReviewCandidateRowInterface,
    RefundableExpenseCandidateInterface,
    RefundableExpenseCandidateRowInterface
} from '@budgie/contracts';

export class RefundPairRepository extends Context.Service<RefundPairRepository>()('@budgie/consolidation/RefundPairRepository', {
    make: Effect.sync(() => {
        const mapCandidateBaseRow = (row: RefundCandidateBaseRowInterface): RefundCandidateBaseInterface => ({
            accountId: row.accountId,
            expenseTransactionId: row.expenseTransactionId,
            expenseEntryAmount: row.expenseEntryAmount,
            refundIncomeTransactionIds: row.refundIncomeTransactionIds.split(',').map(item => Number(item)),
            refundsTotal: row.refundsTotal
        });

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
                const rows = yield* Db.query(db => db.$client.getAllAsync<RefundCandidateRowInterface>(REFUND_AUTO_CANDIDATES_SQL(scope)));

                return rows.map((row): RefundCandidateInterface => ({
                    ...mapCandidateBaseRow(row),
                    confidenceBucket: row.confidenceBucket,
                    matchType: row.matchType
                }));
            }),
            findReviewCandidates: Effect.fn('RefundPairRepository.findReviewCandidates')(function* () {
                const rows = yield* Db.query(db => db.$client.getAllAsync<RefundReviewCandidateRowInterface>(REFUND_REVIEW_CANDIDATES_SQL));

                return rows.map((row): RefundReviewCandidateInterface => ({
                    ...mapCandidateBaseRow(row),
                    confidenceBucket: row.confidenceBucket,
                    matchType: row.matchType
                }));
            }),
            findRefundableExpenseCandidates: Effect.fn('RefundPairRepository.findRefundableExpenseCandidates')(function* (
                refundIncomeTransactionId: number,
                search: string,
                language: LanguageEnum
            ) {
                const searchPattern = `%${search.trim().toLowerCase()}%`;
                const rows = yield* Db.query(db =>
                    db.$client.getAllAsync<RefundableExpenseCandidateRowInterface>(
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

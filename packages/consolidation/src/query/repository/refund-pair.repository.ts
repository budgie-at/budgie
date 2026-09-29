import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

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

export class RefundPairRepository {
    readonly findCandidates = Effect.fn('RefundPairRepository.findCandidates')(function* (
        this: RefundPairRepository,
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const rows = yield* Db.query(db => db.$client.getAllAsync<RefundCandidateRowInterface>(REFUND_AUTO_CANDIDATES_SQL(scope)));

        return rows.map((row): RefundCandidateInterface => ({
            ...this.mapCandidateBaseRow(row),
            confidenceBucket: row.confidenceBucket,
            matchType: row.matchType
        }));
    });

    readonly findReviewCandidates = Effect.fn('RefundPairRepository.findReviewCandidates')(function* (this: RefundPairRepository) {
        const rows = yield* Db.query(db => db.$client.getAllAsync<RefundReviewCandidateRowInterface>(REFUND_REVIEW_CANDIDATES_SQL));

        return rows.map((row): RefundReviewCandidateInterface => ({
            ...this.mapCandidateBaseRow(row),
            confidenceBucket: row.confidenceBucket,
            matchType: row.matchType
        }));
    });

    readonly findRefundableExpenseCandidates = Effect.fn('RefundPairRepository.findRefundableExpenseCandidates')(function* (
        this: RefundPairRepository,
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

        return rows.map(row => this.mapRefundableExpenseCandidateRow(row));
    });

    private mapCandidateBaseRow(row: RefundCandidateBaseRowInterface): RefundCandidateBaseInterface {
        return {
            accountId: row.accountId,
            expenseTransactionId: row.expenseTransactionId,
            expenseEntryAmount: row.expenseEntryAmount,
            refundIncomeTransactionIds: row.refundIncomeTransactionIds.split(',').map(item => Number(item)),
            refundsTotal: row.refundsTotal
        };
    }

    private mapRefundableExpenseCandidateRow(row: RefundableExpenseCandidateRowInterface): RefundableExpenseCandidateInterface {
        return {
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
        };
    }
}

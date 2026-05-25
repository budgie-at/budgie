import { REFUND_AUTO_CANDIDATES_SQL, REFUND_REVIEW_CANDIDATES_SQL } from './sql-factory/refund-ranked-candidate-sql.factory';
import {
    REFUNDABLE_EXPENSE_CANDIDATES_SQL,
    buildRefundableExpenseCandidateParams
} from './sql-factory/refundable-expense-candidate-sql.factory';

import type { DB } from '../../@generic/type/db.type';
import type { RefundCandidateBaseRowInterface } from '../interface/refund-candidate-base-row.interface';
import type { RefundCandidateBaseInterface } from '../interface/refund-candidate-base.interface';
import type { RefundCandidateRowInterface } from '../interface/refund-candidate-row.interface';
import type { RefundCandidateInterface } from '../interface/refund-candidate.interface';
import type { RefundReviewCandidateRowInterface } from '../interface/refund-review-candidate-row.interface';
import type { RefundReviewCandidateInterface } from '../interface/refund-review-candidate.interface';
import type { RefundableExpenseCandidateRowInterface } from '../interface/refundable-expense-candidate-row.interface';
import type { RefundableExpenseCandidateInterface } from '../interface/refundable-expense-candidate.interface';

export class RefundPairRepository {
    constructor(private db: DB) {}

    async findCandidates(): Promise<RefundCandidateInterface[]> {
        const rows = await this.db.$client.getAllAsync<RefundCandidateRowInterface>(REFUND_AUTO_CANDIDATES_SQL);

        return rows.map(row => ({
            ...this.mapCandidateBaseRow(row),
            confidenceBucket: row.confidenceBucket,
            matchType: row.matchType
        }));
    }

    async findReviewCandidates(): Promise<RefundReviewCandidateInterface[]> {
        const rows = await this.db.$client.getAllAsync<RefundReviewCandidateRowInterface>(REFUND_REVIEW_CANDIDATES_SQL);

        return rows.map(row => ({
            ...this.mapCandidateBaseRow(row),
            confidenceBucket: row.confidenceBucket,
            matchType: row.matchType
        }));
    }

    async findRefundableExpenseCandidates(
        refundIncomeTransactionId: number,
        search: string
    ): Promise<RefundableExpenseCandidateInterface[]> {
        const searchPattern = `%${search.trim().toLowerCase()}%`;
        const rows = await this.db.$client.getAllAsync<RefundableExpenseCandidateRowInterface>(
            REFUNDABLE_EXPENSE_CANDIDATES_SQL,
            buildRefundableExpenseCandidateParams(refundIncomeTransactionId, searchPattern)
        );

        return rows.map(row => this.mapRefundableExpenseCandidateRow(row));
    }

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

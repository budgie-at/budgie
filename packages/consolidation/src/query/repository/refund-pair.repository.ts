import { REFUND_AUTO_CANDIDATES_SQL, REFUND_REVIEW_CANDIDATES_SQL } from './sql-factory/refund-ranked-candidate-sql.factory';
import {
    REFUNDABLE_EXPENSE_CANDIDATES_SQL,
    buildRefundableExpenseCandidateParams
} from './sql-factory/refundable-expense-candidate-sql.factory';

import type {
    ConsolidationScanScopeInterface,
    DB,
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
    constructor(private db: DB) {}

    async findCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<RefundCandidateInterface[]> {
        const rows = await this.db.$client.getAllAsync<RefundCandidateRowInterface>(REFUND_AUTO_CANDIDATES_SQL(scope));

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

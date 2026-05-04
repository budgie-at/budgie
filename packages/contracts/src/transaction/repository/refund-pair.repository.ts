/* eslint-disable max-lines-per-function -- File owns a single multi-stage SQL/CTE pipeline that must stay together */
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS } from '../constant/refund-manual-review-time-window.constant';
import { REFUND_TIME_WINDOW_SECONDS } from '../constant/refund-time-window.constant';
import { REFUND_TITLE_PREFIXES } from '../constant/refund-title-prefixes.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import type { DB } from '../../@generic/type/db.type';
import type { RefundAutoConfidenceBucket } from '../interface/refund-auto-confidence-bucket.type';
import type { RefundCandidateInterface } from '../interface/refund-candidate.interface';
import type { RefundReviewCandidateInterface } from '../interface/refund-review-candidate.interface';
import type { RefundReviewConfidenceBucket } from '../interface/refund-review-confidence-bucket.type';

type RefundCandidateRowInterface = {
    readonly confidenceBucket: RefundAutoConfidenceBucket;
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseEntryAmount: number;
    readonly expenseOperatedAt: number;
    readonly refundIncomeTransactionIds: string;
    readonly refundIncomeAmounts: string;
    readonly refundsTotal: number;
    readonly maxTimeDiffSeconds: number;
};

type RefundReviewCandidateRowInterface = {
    readonly confidenceBucket: RefundReviewConfidenceBucket;
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseEntryAmount: number;
    readonly refundIncomeTransactionIds: string;
    readonly refundIncomeAmounts: string;
    readonly refundsTotal: number;
    readonly maxTimeDiffSeconds: number;
};

export class RefundPairRepository {
    constructor(private db: DB) {}

    async findCandidates(): Promise<RefundCandidateInterface[]> {
        const sql = this.buildAutoBucketSql();
        const rows = await this.db.$client.getAllAsync<RefundCandidateRowInterface>(sql);

        return rows.map(row => this.mapRow(row));
    }

    async findReviewCandidates(): Promise<RefundReviewCandidateInterface[]> {
        const sql = this.buildReviewBucketSql();
        const rows = await this.db.$client.getAllAsync<RefundReviewCandidateRowInterface>(sql);

        return rows.map(row => this.mapReviewRow(row));
    }

    private buildAutoBucketSql(): string {
        return `
            WITH expense_entries AS (
                SELECT
                    expense_tx.id AS txId,
                    expense_tx.title AS txTitle,
                    expense_tx.operated_at AS operatedAt,
                    expense_entry.account_id AS accountId,
                    expense_entry.amount AS amount,
                    UPPER(TRIM(expense_tx.title)) AS normTitle
                FROM transactions expense_tx
                INNER JOIN transaction_entries expense_entry
                    ON expense_entry.transaction_id = expense_tx.id
                    AND expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND expense_entry.amount > 0
                WHERE expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                    AND expense_tx.consolidation_type IS NULL
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
            ),
            income_entries AS (
                SELECT
                    income_tx.id AS txId,
                    income_tx.operated_at AS operatedAt,
                    income_entry.account_id AS accountId,
                    income_entry.amount AS amount,
                    UPPER(TRIM(income_tx.title)) AS normTitle
                FROM transactions income_tx
                INNER JOIN transaction_entries income_entry
                    ON income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND income_entry.amount > 0
                WHERE income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
            ),
            candidate_pairs AS (
                SELECT
                    exp.txId AS expenseTxId,
                    exp.txTitle AS expenseTitle,
                    exp.accountId AS accountId,
                    exp.amount AS expenseAmount,
                    exp.operatedAt AS expenseOperatedAt,
                    inc.txId AS refundTxId,
                    inc.amount AS refundAmount,
                    (inc.operatedAt - exp.operatedAt) AS timeDiff
                FROM expense_entries exp
                INNER JOIN income_entries inc
                    ON inc.accountId = exp.accountId
                    AND inc.normTitle = exp.normTitle
                    AND inc.operatedAt > exp.operatedAt
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
            )
            SELECT
                'AUTO_STRICT_TITLE' AS confidenceBucket,
                expenseTxId AS expenseTransactionId,
                expenseTitle AS expenseTransactionTitle,
                accountId AS accountId,
                expenseAmount AS expenseEntryAmount,
                expenseOperatedAt AS expenseOperatedAt,
                SUM(refundAmount) AS refundsTotal,
                GROUP_CONCAT(refundTxId, ',' ORDER BY refundTxId) AS refundIncomeTransactionIds,
                GROUP_CONCAT(refundAmount, ',' ORDER BY refundTxId) AS refundIncomeAmounts,
                MAX(timeDiff) AS maxTimeDiffSeconds
            FROM candidate_pairs
            GROUP BY expenseTxId
            HAVING SUM(refundAmount) <= expenseAmount
        `;
    }

    private buildReviewBucketSql(): string {
        const stripPrefixesExp = `TRIM(${REFUND_TITLE_PREFIXES.reduce(
            (acc, prefix) => `REPLACE(${acc}, '${prefix}', '')`,
            'UPPER(TRIM(exp.txTitle))'
        )})`;
        const stripPrefixesInc = `TRIM(${REFUND_TITLE_PREFIXES.reduce(
            (acc, prefix) => `REPLACE(${acc}, '${prefix}', '')`,
            'UPPER(TRIM(inc.txTitle))'
        )})`;

        return `
            WITH expense_entries AS (
                SELECT
                    expense_tx.id AS txId,
                    expense_tx.title AS txTitle,
                    expense_tx.operated_at AS operatedAt,
                    expense_entry.account_id AS accountId,
                    expense_entry.amount AS amount,
                    expense_entry.mcc_category_id AS mccCategoryId
                FROM transactions expense_tx
                INNER JOIN transaction_entries expense_entry
                    ON expense_entry.transaction_id = expense_tx.id
                    AND expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND expense_entry.amount > 0
                WHERE expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                    AND expense_tx.consolidation_type IS NULL
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
            ),
            income_entries AS (
                SELECT
                    income_tx.id AS txId,
                    income_tx.title AS txTitle,
                    income_tx.operated_at AS operatedAt,
                    income_entry.account_id AS accountId,
                    income_entry.amount AS amount,
                    income_entry.mcc_category_id AS mccCategoryId
                FROM transactions income_tx
                INNER JOIN transaction_entries income_entry
                    ON income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND income_entry.amount > 0
                WHERE income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
            ),
            candidate_pairs AS (
                SELECT
                    exp.txId AS expenseTxId,
                    exp.txTitle AS expenseTitle,
                    exp.accountId AS accountId,
                    exp.amount AS expenseAmount,
                    exp.operatedAt AS expenseOperatedAt,
                    inc.txId AS refundTxId,
                    inc.amount AS refundAmount,
                    (inc.operatedAt - exp.operatedAt) AS timeDiff
                FROM expense_entries exp
                INNER JOIN income_entries inc
                    ON inc.accountId = exp.accountId
                    AND inc.mccCategoryId = exp.mccCategoryId
                    AND inc.operatedAt > exp.operatedAt
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS}
                    AND (
                        UPPER(TRIM(inc.txTitle)) LIKE '%' || ${stripPrefixesExp} || '%'
                        OR UPPER(TRIM(exp.txTitle)) LIKE '%' || ${stripPrefixesInc} || '%'
                    )
                    AND NOT (
                        UPPER(TRIM(inc.txTitle)) = UPPER(TRIM(exp.txTitle))
                        AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
                    )
            )
            SELECT
                'REVIEW_PREFIX_STRIP_MCC' AS confidenceBucket,
                expenseTxId AS expenseTransactionId,
                expenseTitle AS expenseTransactionTitle,
                accountId AS accountId,
                expenseAmount AS expenseEntryAmount,
                SUM(refundAmount) AS refundsTotal,
                GROUP_CONCAT(refundTxId, ',' ORDER BY refundTxId) AS refundIncomeTransactionIds,
                GROUP_CONCAT(refundAmount, ',' ORDER BY refundTxId) AS refundIncomeAmounts,
                MAX(timeDiff) AS maxTimeDiffSeconds
            FROM candidate_pairs
            GROUP BY expenseTxId
            HAVING SUM(refundAmount) <= expenseAmount
        `;
    }

    private mapRow(row: RefundCandidateRowInterface): RefundCandidateInterface {
        return {
            confidenceBucket: row.confidenceBucket,
            accountId: row.accountId,
            expenseTransactionId: row.expenseTransactionId,
            expenseTransactionTitle: row.expenseTransactionTitle,
            expenseEntryAmount: row.expenseEntryAmount,
            expenseOperatedAt: row.expenseOperatedAt,
            refundIncomeTransactionIds: this.parseNumberList(row.refundIncomeTransactionIds),
            refundIncomeAmounts: this.parseNumberList(row.refundIncomeAmounts),
            refundsTotal: row.refundsTotal,
            maxTimeDiffSeconds: row.maxTimeDiffSeconds
        };
    }

    private mapReviewRow(row: RefundReviewCandidateRowInterface): RefundReviewCandidateInterface {
        return {
            confidenceBucket: row.confidenceBucket,
            accountId: row.accountId,
            expenseTransactionId: row.expenseTransactionId,
            expenseTransactionTitle: row.expenseTransactionTitle,
            expenseEntryAmount: row.expenseEntryAmount,
            refundIncomeTransactionIds: this.parseNumberList(row.refundIncomeTransactionIds),
            refundIncomeAmounts: this.parseNumberList(row.refundIncomeAmounts),
            refundsTotal: row.refundsTotal,
            maxTimeDiffSeconds: row.maxTimeDiffSeconds
        };
    }

    private parseNumberList(value: string): number[] {
        return value.split(',').map(item => Number(item));
    }
}

import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { REFUND_TIME_WINDOW_SECONDS } from '../constant/refund-time-window.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import type { DB } from '../../@generic/type/db.type';
import type { RefundCandidateRowInterface } from '../interface/refund-candidate-row.interface';
import type { RefundCandidateInterface } from '../interface/refund-candidate.interface';
import type { RefundReviewCandidateRowInterface } from '../interface/refund-review-candidate-row.interface';
import type { RefundReviewCandidateInterface } from '../interface/refund-review-candidate.interface';

const MANUAL_REVIEW_TIME_WINDOW_SECONDS = 7_776_000;
const TITLE_PREFIXES = ['REFUND', 'RETURN', 'REVERSAL', 'CHARGEBACK', 'CR '] as const;

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

        return rows.map(row => this.mapRow(row));
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
                    exp.accountId AS accountId,
                    exp.amount AS expenseAmount,
                    inc.txId AS refundTxId,
                    inc.amount AS refundAmount
                FROM expense_entries exp
                INNER JOIN income_entries inc
                    ON inc.accountId = exp.accountId
                    AND inc.normTitle = exp.normTitle
                    AND inc.operatedAt > exp.operatedAt
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
            ),
            unambiguous_refunds AS (
                SELECT refundTxId
                FROM candidate_pairs
                GROUP BY refundTxId
                HAVING COUNT(DISTINCT expenseTxId) = 1
            )
            SELECT
                candidate_pairs.expenseTxId AS expenseTransactionId,
                candidate_pairs.accountId AS accountId,
                candidate_pairs.expenseAmount AS expenseEntryAmount,
                SUM(candidate_pairs.refundAmount) AS refundsTotal,
                GROUP_CONCAT(candidate_pairs.refundTxId, ',' ORDER BY candidate_pairs.refundTxId) AS refundIncomeTransactionIds
            FROM candidate_pairs
            INNER JOIN unambiguous_refunds
                ON unambiguous_refunds.refundTxId = candidate_pairs.refundTxId
            GROUP BY candidate_pairs.expenseTxId
            HAVING SUM(candidate_pairs.refundAmount) <= candidate_pairs.expenseAmount
        `;
    }

    private buildReviewBucketSql(): string {
        const stripPrefixesExp = this.buildStripPrefixesSql('UPPER(TRIM(exp.txTitle))');
        const stripPrefixesInc = this.buildStripPrefixesSql('UPPER(TRIM(inc.txTitle))');

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
                    exp.accountId AS accountId,
                    exp.amount AS expenseAmount,
                    inc.txId AS refundTxId,
                    inc.amount AS refundAmount
                FROM expense_entries exp
                INNER JOIN income_entries inc
                    ON inc.accountId = exp.accountId
                    AND inc.mccCategoryId = exp.mccCategoryId
                    AND inc.operatedAt > exp.operatedAt
                    AND (inc.operatedAt - exp.operatedAt) <= ${MANUAL_REVIEW_TIME_WINDOW_SECONDS}
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
                expenseTxId AS expenseTransactionId,
                accountId AS accountId,
                expenseAmount AS expenseEntryAmount,
                SUM(refundAmount) AS refundsTotal,
                GROUP_CONCAT(refundTxId, ',' ORDER BY refundTxId) AS refundIncomeTransactionIds
            FROM candidate_pairs
            GROUP BY expenseTxId
            HAVING SUM(refundAmount) <= expenseAmount
        `;
    }

    private buildStripPrefixesSql(seedExpression: string): string {
        return `TRIM(${TITLE_PREFIXES.reduce((acc, prefix) => `REPLACE(${acc}, '${prefix}', '')`, seedExpression)})`;
    }

    private mapRow(row: RefundCandidateRowInterface): RefundCandidateInterface {
        return {
            accountId: row.accountId,
            expenseTransactionId: row.expenseTransactionId,
            expenseEntryAmount: row.expenseEntryAmount,
            refundIncomeTransactionIds: row.refundIncomeTransactionIds.split(',').map(item => Number(item)),
            refundsTotal: row.refundsTotal
        };
    }
}

import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { REFUND_TIME_WINDOW_SECONDS } from '../constant/refund-time-window.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import type { DB } from '../../@generic/type/db.type';
import type { RefundCandidateRowInterface } from '../interface/refund-candidate-row.interface';
import type { RefundCandidateInterface } from '../interface/refund-candidate.interface';
import type { RefundReviewCandidateRowInterface } from '../interface/refund-review-candidate-row.interface';
import type { RefundReviewCandidateInterface } from '../interface/refund-review-candidate.interface';

const MANUAL_REVIEW_TIME_WINDOW_SECONDS = 7_776_000;
const CARD_REVERSAL_TIME_WINDOW_SECONDS = 600;
const CARD_REVERSAL_TITLE_PREFIXES = ['Скасування. ', 'Скасування '] as const;
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
        const strippedCardReversalIncomeTitle = this.buildStripPrefixesSql('TRIM(income_tx.title)', CARD_REVERSAL_TITLE_PREFIXES);

        return `
            WITH ${this.buildExactTitleCandidatePairsSql()},
            ${this.buildCardReversalCandidatePairsSql(strippedCardReversalIncomeTitle)},
            candidate_pairs AS (
                SELECT
                    expenseTxId,
                    accountId,
                    expenseAmount,
                    refundTxId,
                    refundAmount
                FROM exact_title_candidate_pairs
                UNION ALL
                SELECT
                    expenseTxId,
                    accountId,
                    expenseAmount,
                    refundTxId,
                    refundAmount
                FROM card_reversal_candidate_pairs
                WHERE refundCandidateRank = 1
                    AND expenseCandidateRank = 1
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

    private buildExactTitleCandidatePairsSql(): string {
        return `
            exact_title_candidate_pairs AS (
                SELECT
                    expense_tx.id AS expenseTxId,
                    expense_entry.account_id AS accountId,
                    expense_entry.amount AS expenseAmount,
                    income_tx.id AS refundTxId,
                    income_entry.amount AS refundAmount
                FROM transactions income_tx INDEXED BY transactions_visible_type_operated_idx
                INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                    ON income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND income_entry.amount > 0
                CROSS JOIN transactions expense_tx INDEXED BY transactions_visible_type_operated_idx
                INNER JOIN transaction_entries expense_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                    ON expense_entry.transaction_id = expense_tx.id
                    AND expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND expense_entry.account_id = income_entry.account_id
                    AND expense_entry.amount > 0
                WHERE income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                    AND expense_tx.consolidation_type IS NULL
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.operated_at >= income_tx.operated_at - ${REFUND_TIME_WINDOW_SECONDS}
                    AND expense_tx.operated_at < income_tx.operated_at
                    AND UPPER(TRIM(expense_tx.title)) = UPPER(TRIM(income_tx.title))
            )`;
    }

    private buildCardReversalCandidatePairsSql(strippedCardReversalIncomeTitle: string): string {
        return `
            card_reversal_candidate_pairs AS (
                SELECT
                    expense_tx.id AS expenseTxId,
                    expense_entry.account_id AS accountId,
                    expense_entry.amount AS expenseAmount,
                    income_tx.id AS refundTxId,
                    income_entry.amount AS refundAmount,
                    ROW_NUMBER() OVER (
                        PARTITION BY income_tx.id
                        ORDER BY income_tx.operated_at - expense_tx.operated_at, expense_tx.id
                    ) AS refundCandidateRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY expense_tx.id
                        ORDER BY income_tx.operated_at - expense_tx.operated_at, income_tx.id
                    ) AS expenseCandidateRank
                FROM transactions income_tx INDEXED BY transactions_visible_type_operated_idx
                INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                    ON income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND income_entry.amount > 0
                CROSS JOIN transactions expense_tx INDEXED BY transactions_visible_type_operated_idx
                INNER JOIN transaction_entries expense_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                    ON expense_entry.transaction_id = expense_tx.id
                    AND expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND expense_entry.account_id = income_entry.account_id
                    AND expense_entry.amount = income_entry.amount
                WHERE income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                    AND expense_tx.consolidation_type IS NULL
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.operated_at >= income_tx.operated_at - ${CARD_REVERSAL_TIME_WINDOW_SECONDS}
                    AND expense_tx.operated_at < income_tx.operated_at
                    AND ${strippedCardReversalIncomeTitle} != TRIM(income_tx.title)
                    AND UPPER(TRIM(expense_tx.title)) = UPPER(${strippedCardReversalIncomeTitle})
            )`;
    }

    private buildReviewBucketSql(): string {
        const stripPrefixesExp = this.buildStripPrefixesSql('UPPER(TRIM(expense_tx.title))', TITLE_PREFIXES);
        const stripPrefixesInc = this.buildStripPrefixesSql('UPPER(TRIM(income_tx.title))', TITLE_PREFIXES);

        return `
            WITH candidate_pairs AS (
                SELECT
                    expense_tx.id AS expenseTxId,
                    expense_entry.account_id AS accountId,
                    expense_entry.amount AS expenseAmount,
                    income_tx.id AS refundTxId,
                    income_entry.amount AS refundAmount
                FROM transactions income_tx INDEXED BY transactions_visible_type_operated_idx
                INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                    ON income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND income_entry.amount > 0
                CROSS JOIN transactions expense_tx INDEXED BY transactions_visible_type_operated_idx
                INNER JOIN transaction_entries expense_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                    ON expense_entry.transaction_id = expense_tx.id
                    AND expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND expense_entry.account_id = income_entry.account_id
                    AND expense_entry.mcc_category_id = income_entry.mcc_category_id
                    AND expense_entry.amount > 0
                WHERE income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                    AND expense_tx.consolidation_type IS NULL
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.operated_at >= income_tx.operated_at - ${MANUAL_REVIEW_TIME_WINDOW_SECONDS}
                    AND expense_tx.operated_at < income_tx.operated_at
                    AND ${stripPrefixesInc} != ''
                    AND ${stripPrefixesExp} != ''
                    AND (
                        UPPER(TRIM(income_tx.title)) LIKE '%' || ${stripPrefixesExp} || '%'
                        OR UPPER(TRIM(expense_tx.title)) LIKE '%' || ${stripPrefixesInc} || '%'
                    )
                    AND NOT (
                        UPPER(TRIM(income_tx.title)) = UPPER(TRIM(expense_tx.title))
                        AND expense_tx.operated_at >= income_tx.operated_at - ${REFUND_TIME_WINDOW_SECONDS}
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

    private buildStripPrefixesSql(seedExpression: string, prefixes: readonly string[]): string {
        return `TRIM(${prefixes.reduce((acc, prefix) => `REPLACE(${acc}, '${prefix}', '')`, seedExpression)})`;
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

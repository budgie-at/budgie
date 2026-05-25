import { TransactionEntryTypeEnum } from '../../../transaction-entry/enum/transaction-entry-type.enum';
import { REFUND_TIME_WINDOW_SECONDS } from '../../constant/refund-time-window.constant';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

const MANUAL_REVIEW_TIME_WINDOW_SECONDS = 7_776_000;
const CARD_REVERSAL_TIME_WINDOW_SECONDS = 600;

const AUTO_TITLE_PREFIXES = [
    'Скасування. ',
    'Скасування.',
    'Скасування ',
    'ПОВЕРНЕННЯ КОШТІВ, ',
    'Повернення коштів, ',
    'Повернення, ',
    'Повернення '
] as const;

const REVIEW_TITLE_PREFIXES = [
    ...AUTO_TITLE_PREFIXES,
    'REFUND ',
    'REFUND',
    'RETURN ',
    'RETURN',
    'REVERSAL ',
    'REVERSAL',
    'CHARGEBACK ',
    'CHARGEBACK',
    'CR '
] as const;

const buildStripPrefixesSql = (seedExpression: string, prefixes: readonly string[]): string =>
    `TRIM(${prefixes.reduce((acc, prefix) => `REPLACE(${acc}, '${prefix}', '')`, seedExpression)})`;

const buildStripCommaSuffixSql = (seedExpression: string): string =>
    `TRIM(CASE WHEN INSTR(${seedExpression}, ',') > 0 THEN SUBSTR(${seedExpression}, 1, INSTR(${seedExpression}, ',') - 1) ELSE ${seedExpression} END)`;

const buildExpenseEntriesSql = (autoTitle: string, reviewTitle: string, reviewMerchantTitle: string): string => `
    expense_entries AS (
        SELECT
            expense_tx.id AS expenseTxId,
            expense_tx.operated_at AS operatedAt, expense_entry.account_id AS accountId,
            expense_account.instrument_id AS instrumentId,
            expense_entry.amount AS amount, expense_entry.mcc_category_id AS mccCategoryId,
            UPPER(TRIM(expense_tx.title)) AS rawNormTitle,
            ${autoTitle} AS autoNormTitle,
            ${reviewTitle} AS reviewNormTitle,
            ${reviewMerchantTitle} AS reviewMerchantNormTitle
        FROM transactions expense_tx INDEXED BY transactions_visible_type_operated_idx
        INNER JOIN transaction_entries expense_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
            ON expense_entry.transaction_id = expense_tx.id
            AND expense_entry.deleted_at IS NULL
            AND expense_entry.original_transaction_id IS NULL
            AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
            AND expense_entry.amount > 0
        INNER JOIN accounts expense_account ON expense_account.id = expense_entry.account_id
        WHERE expense_tx.deleted_at IS NULL
            AND expense_tx.consolidation_parent_transaction_id IS NULL
            AND expense_tx.consolidation_type IS NULL
            AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
    )
`;

const buildIncomeEntriesSql = (autoTitle: string, reviewTitle: string, reviewMerchantTitle: string): string => `
    income_entries AS (
        SELECT
            income_tx.id AS txId,
            income_tx.operated_at AS operatedAt, income_entry.account_id AS accountId,
            income_account.instrument_id AS instrumentId,
            income_entry.amount AS amount, income_entry.mcc_category_id AS mccCategoryId,
            UPPER(TRIM(income_tx.title)) AS rawNormTitle,
            ${autoTitle} AS autoNormTitle,
            ${reviewTitle} AS reviewNormTitle,
            ${reviewMerchantTitle} AS reviewMerchantNormTitle
        FROM transactions income_tx INDEXED BY transactions_visible_type_operated_idx
        INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
            ON income_entry.transaction_id = income_tx.id
            AND income_entry.deleted_at IS NULL
            AND income_entry.original_transaction_id IS NULL
            AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
            AND income_entry.amount > 0
        INNER JOIN accounts income_account ON income_account.id = income_entry.account_id
        WHERE income_tx.deleted_at IS NULL
            AND income_tx.consolidation_parent_transaction_id IS NULL
            AND income_tx.type = '${TransactionTypeEnum.INCOME}'
    )
`;

const buildCompatiblePairsSql = (): string => `
    compatible_pairs AS (
        SELECT
            exp.expenseTxId AS expenseTxId,
            exp.accountId AS accountId,
            exp.amount AS expenseAmount,
            inc.txId AS refundTxId,
            inc.amount AS refundAmount,
            inc.operatedAt - exp.operatedAt AS timeDiff,
            CASE
                WHEN inc.rawNormTitle = exp.rawNormTitle AND inc.accountId = exp.accountId
                    AND inc.rawNormTitle != '' AND inc.operatedAt > exp.operatedAt
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
                THEN 'AUTO_REFUND_EXACT_TITLE'
                WHEN inc.autoNormTitle = exp.autoNormTitle AND inc.accountId = exp.accountId
                    AND inc.autoNormTitle != ''
                    AND inc.rawNormTitle != exp.rawNormTitle AND inc.operatedAt > exp.operatedAt
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
                THEN 'AUTO_REFUND_LOCALIZED_REFUND_TITLE'
                WHEN (inc.reviewNormTitle = exp.reviewNormTitle OR inc.reviewMerchantNormTitle = exp.reviewMerchantNormTitle)
                    AND inc.reviewMerchantNormTitle != ''
                    AND inc.mccCategoryId = exp.mccCategoryId
                    AND inc.rawNormTitle != exp.rawNormTitle AND inc.operatedAt > exp.operatedAt
                    AND (inc.operatedAt - exp.operatedAt) <= ${MANUAL_REVIEW_TIME_WINDOW_SECONDS}
                THEN 'REVIEW_REFUND_PREFIX_TITLE_MCC'
                ELSE NULL
            END AS confidenceBucket,
            CASE
                WHEN inc.rawNormTitle = exp.rawNormTitle THEN 'exact-title'
                WHEN inc.autoNormTitle = exp.autoNormTitle THEN 'localized-refund-title'
                ELSE 'prefix-title-mcc'
            END AS matchType
        FROM income_entries inc
        INNER JOIN expense_entries exp
            ON exp.instrumentId = inc.instrumentId
            AND exp.operatedAt < inc.operatedAt
            AND exp.operatedAt >= inc.operatedAt - ${MANUAL_REVIEW_TIME_WINDOW_SECONDS}
    )
`;

const buildRankedPairsSql = (): string => `
    ranked_pairs AS (
        SELECT
            *,
            COUNT(*) OVER (PARTITION BY refundTxId) AS refundCandidateCount,
            ROW_NUMBER() OVER (
                PARTITION BY refundTxId
                ORDER BY
                    CASE confidenceBucket
                        WHEN 'AUTO_REFUND_EXACT_TITLE' THEN 1
                        WHEN 'AUTO_REFUND_LOCALIZED_REFUND_TITLE' THEN 2
                        WHEN 'REVIEW_REFUND_PREFIX_TITLE_MCC' THEN 3
                        ELSE 99
                    END,
                    timeDiff
            ) AS refundRank,
            ROW_NUMBER() OVER (
                PARTITION BY expenseTxId
                ORDER BY
                    CASE confidenceBucket
                        WHEN 'AUTO_REFUND_EXACT_TITLE' THEN 1
                        WHEN 'AUTO_REFUND_LOCALIZED_REFUND_TITLE' THEN 2
                        WHEN 'REVIEW_REFUND_PREFIX_TITLE_MCC' THEN 3
                        ELSE 99
                    END,
                    timeDiff,
                    refundTxId
            ) AS expenseRank
        FROM compatible_pairs
        WHERE confidenceBucket IS NOT NULL
    )
`;

const buildRankedCandidateSql = (): string => {
    const expenseAutoTitle = buildStripPrefixesSql('UPPER(TRIM(expense_tx.title))', AUTO_TITLE_PREFIXES);
    const incomeAutoTitle = buildStripPrefixesSql('UPPER(TRIM(income_tx.title))', AUTO_TITLE_PREFIXES);
    const expenseReviewTitle = buildStripPrefixesSql('UPPER(TRIM(expense_tx.title))', REVIEW_TITLE_PREFIXES);
    const incomeReviewTitle = buildStripPrefixesSql('UPPER(TRIM(income_tx.title))', REVIEW_TITLE_PREFIXES);
    const expenseReviewMerchantTitle = buildStripCommaSuffixSql(expenseReviewTitle);
    const incomeReviewMerchantTitle = buildStripCommaSuffixSql(incomeReviewTitle);

    return `
        WITH ${buildExpenseEntriesSql(expenseAutoTitle, expenseReviewTitle, expenseReviewMerchantTitle)},
        ${buildIncomeEntriesSql(incomeAutoTitle, incomeReviewTitle, incomeReviewMerchantTitle)},
        ${buildCompatiblePairsSql()},
        ${buildRankedPairsSql()}
        SELECT * FROM ranked_pairs
    `;
};

export const REFUND_AUTO_CANDIDATES_SQL = `
    SELECT
        confidenceBucket, matchType,
        expenseTxId AS expenseTransactionId,
        accountId,
        expenseAmount AS expenseEntryAmount,
        SUM(refundAmount) AS refundsTotal,
        GROUP_CONCAT(refundTxId, ',' ORDER BY refundTxId) AS refundIncomeTransactionIds
    FROM (${buildRankedCandidateSql()})
    WHERE refundRank = 1
        AND confidenceBucket IN ('AUTO_REFUND_EXACT_TITLE', 'AUTO_REFUND_LOCALIZED_REFUND_TITLE')
        AND (
            refundCandidateCount = 1
            OR (
                confidenceBucket = 'AUTO_REFUND_LOCALIZED_REFUND_TITLE'
                AND expenseRank = 1
                AND expenseAmount = refundAmount
                AND timeDiff <= ${CARD_REVERSAL_TIME_WINDOW_SECONDS}
            )
        )
    GROUP BY confidenceBucket, matchType, expenseTxId, accountId, expenseAmount
    HAVING SUM(refundAmount) <= expenseAmount
`;

export const REFUND_REVIEW_CANDIDATES_SQL = `
    SELECT
        expenseTxId AS expenseTransactionId,
        confidenceBucket, matchType, accountId,
        expenseAmount AS expenseEntryAmount,
        SUM(refundAmount) AS refundsTotal,
        GROUP_CONCAT(refundTxId, ',' ORDER BY refundTxId) AS refundIncomeTransactionIds
    FROM (${buildRankedCandidateSql()})
    WHERE refundRank = 1
        AND confidenceBucket IN ('REVIEW_REFUND_PREFIX_TITLE_MCC')
    GROUP BY confidenceBucket, matchType, expenseTxId, accountId, expenseAmount
    HAVING SUM(refundAmount) <= expenseAmount
`;

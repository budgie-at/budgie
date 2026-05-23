import { TransactionEntryTypeEnum } from '../../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionConsolidationTypeEnum } from '../../enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

const MANUAL_RECOMMENDED_AMOUNT_DISTANCE_RATIO = 0.05;
const MANUAL_RECOMMENDED_DATE_DISTANCE_SECONDS = 604_800;

const buildManualRecommendedSql = (): string => `
    CASE
        WHEN LOWER(candidate.title) = LOWER(current_tx.title) THEN 1
        WHEN LOWER(candidate.title) = LOWER('Скасування. ' || current_tx.title) THEN 1
        WHEN LOWER(current_tx.title) = LOWER('Скасування. ' || candidate.title) THEN 1
        WHEN candidate_entry.amount = current_entry.amount THEN 1
        WHEN ABS(candidate_entry.amount - current_entry.amount) <= current_entry.amount * ?
            AND ABS(candidate.operated_at - current_tx.operated_at) <= ? THEN 1
        ELSE 0
    END
`;

const buildManualSearchSql = (): string => `
    (
        ? = '%%'
        OR LOWER(candidate.title) LIKE ?
        OR LOWER(candidate.comment) LIKE ?
        OR LOWER(account.title) LIKE ?
        OR LOWER(category.title) LIKE ?
        OR LOWER(COALESCE(category.title_en, '')) LIKE ?
    )
`;

const buildManualCurrentTransactionSql = (): string => `
    current_tx AS (
        SELECT id, type, title, operated_at
        FROM transactions
        WHERE id = ?
          AND deleted_at IS NULL
          AND consolidation_parent_transaction_id IS NULL
          AND type = ?
    )
`;

const buildManualCurrentEntrySql = (): string => `
    current_entry AS (
        SELECT entry.amount, account.instrument_id
        FROM transaction_entries entry
        INNER JOIN current_tx ON current_tx.id = entry.transaction_id
        INNER JOIN accounts account ON account.id = entry.account_id
        WHERE entry.deleted_at IS NULL
          AND entry.original_transaction_id IS NULL
          AND entry.type = ?
        LIMIT 1
    )
`;

const buildManualRefundTotalsSql = (): string => `
    refund_totals AS (
        SELECT transaction_id, COALESCE(SUM(amount), 0) AS refunds_total
        FROM transaction_entries
        WHERE deleted_at IS NULL
          AND original_transaction_id IS NOT NULL
          AND type = ?
        GROUP BY transaction_id
    )
`;

const buildManualCandidateSelectSql = (): string => `
    SELECT
        candidate.id AS id,
        candidate.type AS type,
        candidate.title AS title,
        candidate.comment AS comment,
        candidate.operated_at * 1000 AS operatedAtMs,
        candidate_entry.amount AS amount,
        account.title AS accountTitle,
        instrument.code AS currencyCode,
        instrument.symbol AS currencySymbol,
        category.title AS categoryTitle,
        category.title_en AS categoryTitleEn,
        category.icon AS categoryIcon,
        ${buildManualRecommendedSql()} AS isRecommended,
        ABS(candidate_entry.amount - current_entry.amount) AS amount_distance,
        ABS(candidate.operated_at - current_tx.operated_at) AS date_distance
`;

const buildManualCandidateFromSql = (): string => `
    FROM transactions candidate
    INNER JOIN transaction_entries candidate_entry ON candidate_entry.transaction_id = candidate.id
    INNER JOIN accounts account ON account.id = candidate_entry.account_id
    INNER JOIN instruments instrument ON instrument.id = account.instrument_id
    LEFT JOIN categories category ON category.id = candidate_entry.category_id
    CROSS JOIN current_tx
    CROSS JOIN current_entry
    LEFT JOIN refund_totals ON refund_totals.transaction_id = candidate.id
`;

const buildManualCandidateWhereSql = (): string => `
    WHERE candidate.id != current_tx.id
      AND candidate.deleted_at IS NULL
      AND candidate.consolidation_parent_transaction_id IS NULL
      AND candidate_entry.deleted_at IS NULL
      AND candidate_entry.original_transaction_id IS NULL
      AND candidate_entry.type = ?
      AND account.instrument_id = current_entry.instrument_id
      AND candidate.type = ?
      AND candidate_entry.amount >= current_entry.amount + COALESCE(refund_totals.refunds_total, 0)
      AND (candidate.consolidation_type IS NULL OR candidate.consolidation_type = ?)
      AND ${buildManualSearchSql()}
`;

export const REFUNDABLE_EXPENSE_CANDIDATES_SQL = `
    WITH ${buildManualCurrentTransactionSql()},
    ${buildManualCurrentEntrySql()},
    ${buildManualRefundTotalsSql()}
    ${buildManualCandidateSelectSql()}
    ${buildManualCandidateFromSql()}
    ${buildManualCandidateWhereSql()}
    ORDER BY isRecommended DESC, amount_distance ASC, date_distance ASC, candidate.operated_at DESC, candidate.id DESC
    LIMIT 80
`;

export const buildRefundableExpenseCandidateParams = (refundIncomeTransactionId: number, searchPattern: string): (number | string)[] => [
    refundIncomeTransactionId,
    TransactionTypeEnum.INCOME,
    TransactionEntryTypeEnum.DEBIT,
    TransactionEntryTypeEnum.DEBIT,
    MANUAL_RECOMMENDED_AMOUNT_DISTANCE_RATIO,
    MANUAL_RECOMMENDED_DATE_DISTANCE_SECONDS,
    TransactionEntryTypeEnum.CREDIT,
    TransactionTypeEnum.EXPENSE,
    TransactionConsolidationTypeEnum.REFUND,
    searchPattern,
    searchPattern,
    searchPattern,
    searchPattern,
    searchPattern,
    searchPattern
];

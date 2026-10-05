import { AccountTypeEnum, TransactionEntryKindEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { buildConsolidationScanScopeSql } from '../../utils/build-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS = 2 * 24 * 60 * 60;
const MANUAL_EXPENSE_DUPLICATE_MIN_ACCOUNT_PAIR_SUPPORT = 3;
const MANUAL_EXPENSE_DUPLICATE_APPROXIMATE_TIME_WINDOW_SECONDS = 3 * 60 * 60;
const MANUAL_EXPENSE_DUPLICATE_APPROXIMATE_AMOUNT_PERCENT = 1;
const PERCENT_DIVISOR = 100;

const MANUAL_EXPENSE_DUPLICATE_PAIRS_SQL = `
    WITH synced_expenses AS MATERIALIZED (
        SELECT
            synced_tx.id AS syncedTransactionId,
            synced_tx.operated_at AS operatedAt,
            synced_tx.external_source AS externalSource,
            synced_entry.account_id AS accountId,
            synced_entry.amount AS amount,
            synced_account.instrument_id AS instrumentId
        FROM transactions synced_tx INDEXED BY transactions_visible_type_operated_idx
        INNER JOIN transaction_entries synced_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
            ON synced_entry.transaction_id = synced_tx.id
            AND synced_entry.deleted_at IS NULL
            AND synced_entry.original_transaction_id IS NULL
            AND synced_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
            AND synced_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
        INNER JOIN accounts synced_account
            ON synced_account.id = synced_entry.account_id
            AND synced_account.type = '${AccountTypeEnum.BANK_SYNC}'
        WHERE synced_tx.type = '${TransactionTypeEnum.EXPENSE}'
            AND synced_tx.deleted_at IS NULL
            AND synced_tx.consolidation_parent_transaction_id IS NULL
            AND synced_tx.consolidation_type IS NULL
            AND synced_tx.external_id IS NOT NULL
            AND synced_tx.external_source IS NOT NULL
            AND NOT EXISTS (
                SELECT 1
                FROM transaction_entries synced_sibling_entry
                WHERE synced_sibling_entry.transaction_id = synced_tx.id
                    AND synced_sibling_entry.deleted_at IS NULL
                    AND synced_sibling_entry.id != synced_entry.id
                    AND (
                        synced_sibling_entry.original_transaction_id IS NOT NULL
                        OR synced_sibling_entry.type != '${TransactionEntryTypeEnum.FEE}'
                    )
            )
            AND NOT EXISTS (
                SELECT 1
                FROM debt_events synced_debt_event
                WHERE synced_debt_event.transaction_id = synced_tx.id
                    AND synced_debt_event.deleted_at IS NULL
            )
    ),
    manual_expenses AS MATERIALIZED (
        SELECT
            manual_tx.id AS manualTransactionId,
            manual_tx.operated_at AS operatedAt,
            manual_entry.account_id AS accountId,
            manual_entry.amount AS amount,
            manual_account.instrument_id AS instrumentId
        FROM transactions manual_tx INDEXED BY transactions_visible_type_operated_idx
        INNER JOIN transaction_entries manual_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
            ON manual_entry.transaction_id = manual_tx.id
            AND manual_entry.deleted_at IS NULL
            AND manual_entry.original_transaction_id IS NULL
        INNER JOIN accounts manual_account
            ON manual_account.id = manual_entry.account_id
            AND manual_account.type = '${AccountTypeEnum.BANK}'
        WHERE manual_tx.type = '${TransactionTypeEnum.EXPENSE}'
            AND manual_tx.deleted_at IS NULL
            AND manual_tx.consolidation_parent_transaction_id IS NULL
            AND manual_tx.consolidation_type IS NULL
            AND manual_tx.external_id IS NULL
            AND manual_tx.external_source IS NULL
            AND NOT EXISTS (
                SELECT 1
                FROM transaction_entries manual_sibling_entry
                WHERE manual_sibling_entry.transaction_id = manual_tx.id
                    AND manual_sibling_entry.deleted_at IS NULL
                    AND manual_sibling_entry.id != manual_entry.id
            )
            AND NOT EXISTS (
                SELECT 1
                FROM debt_events manual_debt_event
                WHERE manual_debt_event.transaction_id = manual_tx.id
                    AND manual_debt_event.deleted_at IS NULL
            )
    ),
    eligible_pairs AS (
        SELECT
            synced.syncedTransactionId AS syncedTransactionId,
            synced.externalSource AS externalSource,
            synced.accountId AS syncedAccountId,
            synced.operatedAt AS syncedOperatedAt,
            manual.manualTransactionId AS manualTransactionId,
            manual.accountId AS manualAccountId,
            manual.amount = synced.amount AS isExactAmount,
            MAX(manual.amount = synced.amount) OVER (PARTITION BY synced.syncedTransactionId) AS syncedHasExactAmount,
            MAX(manual.amount = synced.amount) OVER (PARTITION BY manual.manualTransactionId) AS manualHasExactAmount,
            COUNT(*) OVER (PARTITION BY synced.syncedTransactionId, manual.amount = synced.amount) AS syncedMatchCount,
            COUNT(*) OVER (PARTITION BY manual.manualTransactionId, manual.amount = synced.amount) AS manualMatchCount
        FROM synced_expenses synced
        INNER JOIN manual_expenses manual
            ON manual.instrumentId = synced.instrumentId
            AND manual.operatedAt BETWEEN synced.operatedAt - ${MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS}
                AND synced.operatedAt + ${MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS}
            AND (
                manual.amount = synced.amount
                OR (
                    ABS(manual.operatedAt - synced.operatedAt) <= ${MANUAL_EXPENSE_DUPLICATE_APPROXIMATE_TIME_WINDOW_SECONDS}
                    AND ABS(manual.amount - synced.amount) * ${PERCENT_DIVISOR} <= synced.amount * ${MANUAL_EXPENSE_DUPLICATE_APPROXIMATE_AMOUNT_PERCENT}
                )
            )
    ),
    supported_pairs AS (
        SELECT
            *,
            COUNT(*) OVER (PARTITION BY manualAccountId, syncedAccountId, externalSource) AS accountPairSupport
        FROM eligible_pairs
        WHERE syncedMatchCount = 1
            AND manualMatchCount = 1
            AND isExactAmount = syncedHasExactAmount
            AND isExactAmount = manualHasExactAmount
    )
    SELECT syncedTransactionId, manualTransactionId
    FROM supported_pairs
    WHERE accountPairSupport >= ${MANUAL_EXPENSE_DUPLICATE_MIN_ACCOUNT_PAIR_SUPPORT}
`;

export const MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL = (scope: ConsolidationScanScopeInterface | null): string => `
    ${MANUAL_EXPENSE_DUPLICATE_PAIRS_SQL}
        ${buildConsolidationScanScopeSql(scope, 'syncedOperatedAt')}
    ORDER BY syncedOperatedAt, syncedTransactionId
`;

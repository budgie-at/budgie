import {
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { buildConsolidationScanScopeSql } from '../../utils/build-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS = 2 * 24 * 60 * 60;
const MANUAL_EXPENSE_DUPLICATE_MIN_ACCOUNT_PAIR_SUPPORT = 3;
const MANUAL_EXPENSE_DUPLICATE_APPROXIMATE_TIME_WINDOW_SECONDS = 3 * 60 * 60;
const MANUAL_EXPENSE_DUPLICATE_APPROXIMATE_AMOUNT_PERCENT = 1;
const PERCENT_DIVISOR = 100;
const MANUAL_DUPLICATE_ENTRY_TYPE_SQL = (transactionAlias: string): string =>
    `CASE ${transactionAlias}.type WHEN '${TransactionTypeEnum.EXPENSE}' THEN '${TransactionEntryTypeEnum.CREDIT}' ELSE '${TransactionEntryTypeEnum.DEBIT}' END`;
const MANUAL_DUPLICATE_TRANSACTION_TYPES_SQL = `'${TransactionTypeEnum.EXPENSE}', '${TransactionTypeEnum.INCOME}'`;
const MANUAL_ROW_COLUMNS_SQL = `
            manual_tx.id AS manualTransactionId,
            manual_tx.type AS transactionType,
            manual_tx.operated_at AS operatedAt,
            manual_entry.account_id AS accountId,
            manual_entry.amount AS amount,
            manual_account.instrument_id AS instrumentId`;
const MANUAL_TX_COMMON_PREDICATES_SQL = `manual_tx.type IN (${MANUAL_DUPLICATE_TRANSACTION_TYPES_SQL})
            AND manual_tx.deleted_at IS NULL
            AND manual_tx.consolidation_parent_transaction_id IS NULL
            AND manual_tx.consolidation_type IS NULL`;
const MANUAL_ENTRY_COMMON_PREDICATES_SQL = `manual_entry.deleted_at IS NULL
            AND manual_entry.original_transaction_id IS NULL
            AND manual_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
            AND manual_entry.amount > 0`;
const MANUAL_NO_SIBLING_ENTRY_SQL = `NOT EXISTS (
                SELECT 1
                FROM transaction_entries manual_sibling_entry
                WHERE manual_sibling_entry.transaction_id = manual_tx.id
                    AND manual_sibling_entry.deleted_at IS NULL
                    AND manual_sibling_entry.id != manual_entry.id
            )`;
const UNAMBIGUOUS_PAIR_FILTER_SQL = `syncedMatchCount = 1
            AND manualMatchCount = 1
            AND isExactAmount = syncedHasExactAmount
            AND isExactAmount = manualHasExactAmount`;

const buildManualRowsSql = (scopeFilterSql: string, instrumentFilterCte: string | null): string => {
    const driverPrefix = isDefined(instrumentFilterCte) ? `${instrumentFilterCte} CROSS JOIN ` : '';
    const instrumentPredicate = isDefined(instrumentFilterCte)
        ? `AND manual_account.instrument_id = ${instrumentFilterCte}.instrumentId`
        : '';

    return `
        SELECT${MANUAL_ROW_COLUMNS_SQL},
            0 AS isReceipt
        FROM ${driverPrefix}accounts manual_account
        CROSS JOIN transaction_entries manual_entry INDEXED BY transaction_entries_live_account_amount_transaction_idx
            ON manual_entry.account_id = manual_account.id
            AND ${MANUAL_ENTRY_COMMON_PREDICATES_SQL}
        INNER JOIN transactions manual_tx
            ON manual_tx.id = manual_entry.transaction_id
            AND ${MANUAL_TX_COMMON_PREDICATES_SQL}
            AND manual_entry.type = ${MANUAL_DUPLICATE_ENTRY_TYPE_SQL('manual_tx')}
            AND (
                (manual_tx.external_id IS NULL AND manual_tx.external_source IS NULL)
                OR manual_tx.external_source = '${ExternalSourceEnum.CSV}'
            )
            ${scopeFilterSql}
        WHERE manual_account.deleted_at IS NULL
            AND manual_account.type = '${AccountTypeEnum.BANK}'
            ${instrumentPredicate}
            AND ${MANUAL_NO_SIBLING_ENTRY_SQL}
        UNION ALL
        SELECT${MANUAL_ROW_COLUMNS_SQL},
            1 AS isReceipt
        FROM ${driverPrefix}transactions manual_tx INDEXED BY transactions_visible_external_source_type_operated_idx
        INNER JOIN transaction_entries manual_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
            ON manual_entry.transaction_id = manual_tx.id
            AND ${MANUAL_ENTRY_COMMON_PREDICATES_SQL}
            AND manual_entry.type = ${MANUAL_DUPLICATE_ENTRY_TYPE_SQL('manual_tx')}
        INNER JOIN accounts manual_account
            ON manual_account.id = manual_entry.account_id
            AND manual_account.deleted_at IS NULL
            ${instrumentPredicate}
        WHERE manual_tx.external_source IS NOT NULL
            AND manual_tx.external_source = '${ExternalSourceEnum.RECEIPT}'
            AND ${MANUAL_TX_COMMON_PREDICATES_SQL}
            ${scopeFilterSql}
            AND ${MANUAL_NO_SIBLING_ENTRY_SQL}
    `;
};

const buildEligiblePairsSql = (manualCteName: string): string => `
        SELECT
            synced_tx.id AS syncedTransactionId,
            synced_tx.external_source AS externalSource,
            synced_entry.account_id AS syncedAccountId,
            synced_tx.operated_at AS syncedOperatedAt,
            manual.manualTransactionId AS manualTransactionId,
            manual.accountId AS manualAccountId,
            manual.instrumentId AS instrumentId,
            manual.amount = synced_entry.amount AS isExactAmount,
            manual.isReceipt AND manual.accountId = synced_entry.account_id AS isTrustedPair,
            MAX(manual.amount = synced_entry.amount) OVER (PARTITION BY synced_tx.id) AS syncedHasExactAmount,
            MAX(manual.amount = synced_entry.amount) OVER (PARTITION BY manual.manualTransactionId) AS manualHasExactAmount,
            COUNT(*) OVER (PARTITION BY synced_tx.id, manual.amount = synced_entry.amount) AS syncedMatchCount,
            COUNT(*) OVER (PARTITION BY manual.manualTransactionId, manual.amount = synced_entry.amount) AS manualMatchCount
        FROM ${manualCteName} manual
        CROSS JOIN transactions synced_tx INDEXED BY transactions_visible_type_operated_idx
        CROSS JOIN transaction_entries synced_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
        INNER JOIN accounts synced_account
            ON synced_account.id = synced_entry.account_id
            AND synced_account.deleted_at IS NULL
            AND synced_account.type = '${AccountTypeEnum.BANK_SYNC}'
            AND synced_account.instrument_id = manual.instrumentId
        WHERE synced_tx.type = manual.transactionType
            AND synced_tx.operated_at BETWEEN manual.operatedAt - ${MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS}
                AND manual.operatedAt + ${MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS}
            AND synced_tx.deleted_at IS NULL
            AND synced_tx.consolidation_parent_transaction_id IS NULL
            AND synced_tx.consolidation_type IS NULL
            AND synced_tx.external_id IS NOT NULL
            AND synced_tx.external_source IS NOT NULL
            AND synced_tx.external_source NOT IN ('${ExternalSourceEnum.RECEIPT}', '${ExternalSourceEnum.MANUAL}')
            AND (synced_tx.external_source != '${ExternalSourceEnum.APPLE_PAY_AUTOMATION}' OR manual.isReceipt)
            AND synced_entry.transaction_id = synced_tx.id
            AND synced_entry.deleted_at IS NULL
            AND synced_entry.original_transaction_id IS NULL
            AND synced_entry.amount > 0
            AND (
                manual.amount = synced_entry.amount
                OR (
                    ABS(manual.operatedAt - synced_tx.operated_at) <= ${MANUAL_EXPENSE_DUPLICATE_APPROXIMATE_TIME_WINDOW_SECONDS}
                    AND ABS(manual.amount - synced_entry.amount) * ${PERCENT_DIVISOR}
                        <= synced_entry.amount * ${MANUAL_EXPENSE_DUPLICATE_APPROXIMATE_AMOUNT_PERCENT}
                )
            )
            AND synced_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
            AND synced_entry.type = ${MANUAL_DUPLICATE_ENTRY_TYPE_SQL('synced_tx')}
            AND (
                manual.isReceipt = 0
                OR NOT EXISTS (
                    SELECT 1
                    FROM transaction_receipts synced_receipt
                    WHERE synced_receipt.transaction_id = synced_tx.id
                )
            )
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
`;

const UNSCOPED_MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL = `
    WITH manual_rows AS MATERIALIZED (
        ${buildManualRowsSql('', null)}
    ),
    eligible_pairs AS (
        ${buildEligiblePairsSql('manual_rows')}
    ),
    supported_pairs AS (
        SELECT
            *,
            COUNT(*) OVER (PARTITION BY manualAccountId, syncedAccountId, externalSource) AS accountPairSupport
        FROM eligible_pairs
        WHERE ${UNAMBIGUOUS_PAIR_FILTER_SQL}
    )
    SELECT syncedTransactionId, manualTransactionId
    FROM supported_pairs
    WHERE accountPairSupport >= ${MANUAL_EXPENSE_DUPLICATE_MIN_ACCOUNT_PAIR_SUPPORT}
        OR (isTrustedPair AND isExactAmount)
    ORDER BY syncedOperatedAt, syncedTransactionId
`;

const buildScopedManualExpenseDuplicateCandidatesSql = (scope: ConsolidationScanScopeInterface): string => `
    WITH active_manual_rows AS MATERIALIZED (
        ${buildManualRowsSql(buildConsolidationScanScopeSql(scope, 'manual_tx.operated_at', MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS), null)}
    ),
    scoped_eligible_pairs AS (
        ${buildEligiblePairsSql('active_manual_rows')}
    ),
    scoped_candidates AS MATERIALIZED (
        SELECT
            syncedTransactionId,
            externalSource,
            syncedAccountId,
            syncedOperatedAt,
            manualTransactionId,
            manualAccountId,
            instrumentId,
            isExactAmount,
            isTrustedPair
        FROM scoped_eligible_pairs
        WHERE ${UNAMBIGUOUS_PAIR_FILTER_SQL}
            ${buildConsolidationScanScopeSql(scope, 'syncedOperatedAt')}
    ),
    needed_support_instruments AS MATERIALIZED (
        SELECT DISTINCT instrumentId
        FROM scoped_candidates
        WHERE NOT (isTrustedPair AND isExactAmount)
    ),
    historical_manual_rows AS MATERIALIZED (
        ${buildManualRowsSql('', 'needed_support_instruments')}
    ),
    historical_eligible_pairs AS (
        ${buildEligiblePairsSql('historical_manual_rows')}
    ),
    supported_account_pairs AS MATERIALIZED (
        SELECT manualAccountId, syncedAccountId, externalSource
        FROM historical_eligible_pairs
        WHERE ${UNAMBIGUOUS_PAIR_FILTER_SQL}
        GROUP BY manualAccountId, syncedAccountId, externalSource
        HAVING COUNT(*) >= ${MANUAL_EXPENSE_DUPLICATE_MIN_ACCOUNT_PAIR_SUPPORT}
    )
    SELECT
        candidate.syncedTransactionId,
        candidate.manualTransactionId
    FROM scoped_candidates candidate
    WHERE (candidate.isTrustedPair AND candidate.isExactAmount)
        OR EXISTS (
            SELECT 1
            FROM supported_account_pairs supported
            WHERE supported.manualAccountId = candidate.manualAccountId
                AND supported.syncedAccountId = candidate.syncedAccountId
                AND supported.externalSource = candidate.externalSource
        )
    ORDER BY candidate.syncedOperatedAt, candidate.syncedTransactionId
`;

export const MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL = (scope: ConsolidationScanScopeInterface | null): string =>
    isDefined(scope) ? buildScopedManualExpenseDuplicateCandidatesSql(scope) : UNSCOPED_MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL;

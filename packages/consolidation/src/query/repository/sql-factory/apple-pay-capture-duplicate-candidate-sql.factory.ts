import { ExternalSourceEnum, TransactionEntryKindEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { buildConsolidationScanScopeSql } from '../../utils/build-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const APPLE_PAY_CAPTURE_TIME_WINDOW_SECONDS = 2 * 24 * 60 * 60;
const APPLE_PAY_CAPTURE_APPROXIMATE_TIME_WINDOW_SECONDS = 3 * 60 * 60;
const APPLE_PAY_CAPTURE_APPROXIMATE_AMOUNT_PERCENT = 1;
const APPLE_PAY_CAPTURE_FOREIGN_CURRENCY_AMOUNT_PERCENT = 3;
const PERCENT_DIVISOR = 100;

const APPLE_PAY_CAPTURE_DUPLICATE_PAIRS_SQL = `
    WITH captures AS MATERIALIZED (
        SELECT
            capture_tx.id AS captureTransactionId,
            capture_tx.operated_at AS operatedAt,
            capture_entry.account_id AS accountId,
            capture_entry.amount AS amount,
            capture_entry.exchange_rate != 1 AS isForeignCurrency
        FROM transactions capture_tx
        INNER JOIN transaction_entries capture_entry
            ON capture_entry.transaction_id = capture_tx.id
            AND capture_entry.deleted_at IS NULL
            AND capture_entry.original_transaction_id IS NULL
            AND capture_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
            AND capture_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
        WHERE capture_tx.external_source = '${ExternalSourceEnum.APPLE_PAY_AUTOMATION}'
            AND capture_tx.type = '${TransactionTypeEnum.EXPENSE}'
            AND capture_tx.deleted_at IS NULL
            AND capture_tx.consolidation_parent_transaction_id IS NULL
            AND capture_tx.consolidation_type IS NULL
            AND NOT EXISTS (
                SELECT 1
                FROM transaction_entries capture_split_entry
                WHERE capture_split_entry.transaction_id = capture_tx.id
                    AND capture_split_entry.deleted_at IS NULL
                    AND capture_split_entry.id != capture_entry.id
            )
            AND NOT EXISTS (
                SELECT 1
                FROM debt_events capture_debt_event
                WHERE capture_debt_event.transaction_id = capture_tx.id
                    AND capture_debt_event.deleted_at IS NULL
            )
    ),
    capture_bounds AS (
        SELECT
            MIN(operatedAt) - ${APPLE_PAY_CAPTURE_TIME_WINDOW_SECONDS} AS operatedAtFrom,
            MAX(operatedAt) + ${APPLE_PAY_CAPTURE_TIME_WINDOW_SECONDS} AS operatedAtTo
        FROM captures
    ),
    bank_charges AS MATERIALIZED (
        SELECT
            bank_tx.id AS bankTransactionId,
            bank_tx.operated_at AS operatedAt,
            bank_entry.account_id AS accountId,
            bank_entry.exchange_rate != 1 AS isForeignCurrency,
            bank_entry.amount + COALESCE((
                SELECT SUM(bank_fee_entry.amount)
                FROM transaction_entries bank_fee_entry
                WHERE bank_fee_entry.transaction_id = bank_tx.id
                    AND bank_fee_entry.account_id = bank_entry.account_id
                    AND bank_fee_entry.deleted_at IS NULL
                    AND bank_fee_entry.original_transaction_id IS NULL
                    AND bank_fee_entry.type = '${TransactionEntryTypeEnum.FEE}'
            ), 0) AS amount
        FROM capture_bounds
        INNER JOIN transactions bank_tx INDEXED BY transactions_visible_type_operated_idx
            ON bank_tx.type = '${TransactionTypeEnum.EXPENSE}'
            AND bank_tx.operated_at BETWEEN capture_bounds.operatedAtFrom AND capture_bounds.operatedAtTo
        INNER JOIN transaction_entries bank_entry
            ON bank_entry.transaction_id = bank_tx.id
            AND bank_entry.deleted_at IS NULL
            AND bank_entry.original_transaction_id IS NULL
            AND bank_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
            AND bank_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
        WHERE bank_tx.deleted_at IS NULL
            AND bank_tx.consolidation_parent_transaction_id IS NULL
            AND bank_tx.consolidation_type IS NULL
            AND bank_tx.external_id IS NOT NULL
            AND bank_tx.external_source IS NOT NULL
            AND bank_tx.external_source NOT IN (
                '${ExternalSourceEnum.APPLE_PAY_AUTOMATION}',
                '${ExternalSourceEnum.MANUAL}'
            )
            AND bank_entry.account_id IN (SELECT accountId FROM captures)
            AND NOT EXISTS (
                SELECT 1
                FROM transaction_entries bank_split_entry
                WHERE bank_split_entry.transaction_id = bank_tx.id
                    AND bank_split_entry.deleted_at IS NULL
                    AND bank_split_entry.id != bank_entry.id
                    AND (
                        bank_split_entry.original_transaction_id IS NOT NULL
                        OR bank_split_entry.type != '${TransactionEntryTypeEnum.FEE}'
                    )
            )
            AND NOT EXISTS (
                SELECT 1
                FROM debt_events bank_debt_event
                WHERE bank_debt_event.transaction_id = bank_tx.id
                    AND bank_debt_event.deleted_at IS NULL
            )
    ),
    matching_pairs AS (
        SELECT
            bank.bankTransactionId AS bankTransactionId,
            bank.operatedAt AS bankOperatedAt,
            capture.captureTransactionId AS captureTransactionId,
            capture.amount != bank.amount AS isApproximate,
            ABS(capture.operatedAt - bank.operatedAt) AS timeDistance
        FROM captures capture
        INNER JOIN bank_charges bank
            ON bank.accountId = capture.accountId
            AND ABS(capture.operatedAt - bank.operatedAt) <= ${APPLE_PAY_CAPTURE_TIME_WINDOW_SECONDS}
            AND (
                capture.amount = bank.amount
                OR (
                    (capture.isForeignCurrency OR bank.isForeignCurrency)
                    AND ABS(capture.amount - bank.amount) * ${PERCENT_DIVISOR}
                        <= bank.amount * ${APPLE_PAY_CAPTURE_FOREIGN_CURRENCY_AMOUNT_PERCENT}
                )
                OR (
                    ABS(capture.operatedAt - bank.operatedAt) <= ${APPLE_PAY_CAPTURE_APPROXIMATE_TIME_WINDOW_SECONDS}
                    AND ABS(capture.amount - bank.amount) * ${PERCENT_DIVISOR}
                        <= bank.amount * ${APPLE_PAY_CAPTURE_APPROXIMATE_AMOUNT_PERCENT}
                )
            )
    ),
    ranked_pairs AS (
        SELECT
            *,
            ROW_NUMBER() OVER (
                PARTITION BY bankTransactionId
                ORDER BY isApproximate, timeDistance, captureTransactionId
            ) AS bankRank,
            ROW_NUMBER() OVER (
                PARTITION BY captureTransactionId
                ORDER BY isApproximate, timeDistance, bankTransactionId
            ) AS captureRank
        FROM matching_pairs
    )
    SELECT bankTransactionId AS syncedTransactionId, captureTransactionId AS manualTransactionId
    FROM ranked_pairs
    WHERE bankRank = 1
        AND captureRank = 1
`;

export const APPLE_PAY_CAPTURE_DUPLICATE_CANDIDATES_SQL = (scope: ConsolidationScanScopeInterface | null): string => `
    ${APPLE_PAY_CAPTURE_DUPLICATE_PAIRS_SQL}
        ${buildConsolidationScanScopeSql(scope, 'bankOperatedAt')}
    ORDER BY bankOperatedAt, bankTransactionId
`;

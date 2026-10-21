import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { CANONICAL_CENT_TOLERANCE_AMOUNT } from '../../../shared/constant/canonical-cent-tolerance.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../../shared/constant/transfer-pair-fast-time-window.constant';
import { applyConsolidationScanScopeSql } from '../../utils/apply-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const PAIR_SCOPE_SQL_PLACEHOLDER = '__IBAN_BRIDGE_DUPLICATE_PAIR_SCOPE_SQL__';

const IBAN_BRIDGE_DUPLICATE_PAIR_SCOPE_EXPRESSIONS = new Map([[PAIR_SCOPE_SQL_PLACEHOLDER, 'pair_tx.operated_at']]);

const buildCanonicalLegSql = (
    alias: string,
    transactionAlias: string,
    entryType: TransactionEntryTypeEnum,
    accountColumn: string
): string => `
                INNER JOIN transaction_entries ${alias} ON
                    ${alias}.transaction_id = ${transactionAlias}.id
                    AND ${alias}.deleted_at IS NULL
                    AND ${alias}.original_transaction_id IS NULL
                    AND ${alias}.type = '${entryType}'
                    AND ${alias}.account_id = ${transactionAlias}.${accountColumn}`;

const buildMovedLegSql = (
    alias: string,
    transactionType: TransactionTypeEnum,
    entryType: TransactionEntryTypeEnum,
    accountColumn: string
): string => `
                INNER JOIN transaction_entries ${alias}_entry ON
                    ${alias}_entry.transaction_id = pair_tx.id
                    AND ${alias}_entry.deleted_at IS NULL
                    AND ${alias}_entry.type = '${entryType}'
                    AND ${alias}_entry.account_id = pair_tx.${accountColumn}
                INNER JOIN transactions ${alias}_tx ON
                    ${alias}_tx.id = ${alias}_entry.original_transaction_id
                    AND ${alias}_tx.type = '${transactionType}'
                    AND ${alias}_tx.deleted_at IS NULL
                    AND ${alias}_tx.consolidation_parent_transaction_id = pair_tx.id`;

const buildNoClaimedLegSql = (accountColumn: string): string => `NOT EXISTS (
                        SELECT 1
                        FROM transaction_entries claimed_entry
                        WHERE claimed_entry.transaction_id = bridge_tx.id
                            AND claimed_entry.deleted_at IS NULL
                            AND claimed_entry.original_transaction_id IS NOT NULL
                            AND claimed_entry.account_id = bridge_tx.${accountColumn}
                    )`;

const IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_BASE_SQL = `
            WITH candidate_rows AS (
                SELECT
                    pair_tx.id as pairTransactionId,
                    bridge_tx.id as bridgeTransactionId,
                    source_tx.id as sourceExpenseTransactionId,
                    target_tx.id as targetIncomeTransactionId,
                    ABS(pair_tx.operated_at - bridge_tx.operated_at) as timeDiff
                FROM transactions pair_tx
                ${buildCanonicalLegSql('pair_source_entry', 'pair_tx', TransactionEntryTypeEnum.CREDIT, 'from_account_id')}
                ${buildCanonicalLegSql('pair_target_entry', 'pair_tx', TransactionEntryTypeEnum.DEBIT, 'to_account_id')}
                ${buildMovedLegSql('source', TransactionTypeEnum.EXPENSE, TransactionEntryTypeEnum.CREDIT, 'from_account_id')}
                ${buildMovedLegSql('target', TransactionTypeEnum.INCOME, TransactionEntryTypeEnum.DEBIT, 'to_account_id')}
                INNER JOIN transactions bridge_tx ON
                    bridge_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND bridge_tx.deleted_at IS NULL
                    AND bridge_tx.consolidation_parent_transaction_id IS NULL
                    AND bridge_tx.updated_by IS NULL
                    AND bridge_tx.consolidation_type = '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}'
                    AND bridge_tx.from_account_id = pair_tx.from_account_id
                    AND bridge_tx.to_account_id = pair_tx.to_account_id
                    AND bridge_tx.operated_at BETWEEN pair_tx.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND pair_tx.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                ${buildCanonicalLegSql('bridge_source_entry', 'bridge_tx', TransactionEntryTypeEnum.CREDIT, 'from_account_id')}
                    AND ABS(bridge_source_entry.amount - pair_source_entry.amount) <= ${CANONICAL_CENT_TOLERANCE_AMOUNT}
                ${buildCanonicalLegSql('bridge_target_entry', 'bridge_tx', TransactionEntryTypeEnum.DEBIT, 'to_account_id')}
                    AND ABS(bridge_target_entry.amount - pair_target_entry.amount) <= ${CANONICAL_CENT_TOLERANCE_AMOUNT}
                WHERE pair_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND pair_tx.deleted_at IS NULL
                    AND pair_tx.consolidation_parent_transaction_id IS NULL
                    AND pair_tx.updated_by IS NULL
                    AND pair_tx.consolidation_type = '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}'
                    ${PAIR_SCOPE_SQL_PLACEHOLDER}
                    AND (SELECT COUNT(*) FROM transactions pair_child WHERE pair_child.consolidation_parent_transaction_id = pair_tx.id) = 2
                    AND ${buildNoClaimedLegSql('from_account_id')}
                    AND ${buildNoClaimedLegSql('to_account_id')}
            ),
            ranked_rows AS (
                SELECT
                    *,
                    ROW_NUMBER() OVER (PARTITION BY pairTransactionId ORDER BY timeDiff, bridgeTransactionId) as pairRank,
                    ROW_NUMBER() OVER (PARTITION BY bridgeTransactionId ORDER BY timeDiff, pairTransactionId) as bridgeRank
                FROM candidate_rows
            )
            SELECT pairTransactionId, bridgeTransactionId, sourceExpenseTransactionId, targetIncomeTransactionId
            FROM ranked_rows
            WHERE pairRank = 1
                AND bridgeRank = 1
            ORDER BY pairTransactionId
`;

export const IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_SQL = (scope: ConsolidationScanScopeInterface | null): string =>
    applyConsolidationScanScopeSql(IBAN_BRIDGE_DUPLICATE_PAIR_CANDIDATES_BASE_SQL, scope, IBAN_BRIDGE_DUPLICATE_PAIR_SCOPE_EXPRESSIONS);

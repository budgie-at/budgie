import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { CANONICAL_CENT_TOLERANCE_AMOUNT } from '../../../shared/constant/canonical-cent-tolerance.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../../shared/constant/transfer-pair-fast-time-window.constant';
import { applyConsolidationScanScopeSql } from '../../utils/apply-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const SUPERSEDED_SCOPE_SQL_PLACEHOLDER = '__IBAN_BRIDGE_CANONICAL_SUPERSESSION_SUPERSEDED_SCOPE_SQL__';
const CANONICAL_SCOPE_SQL_PLACEHOLDER = '__IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANONICAL_SCOPE_SQL__';

const IBAN_BRIDGE_CANONICAL_SUPERSESSION_SCOPE_EXPRESSIONS = new Map([
    [SUPERSEDED_SCOPE_SQL_PLACEHOLDER, 'superseded_tx.operated_at'],
    [CANONICAL_SCOPE_SQL_PLACEHOLDER, 'canonical_tx.operated_at']
]);

const IBAN_BRIDGE_CONSOLIDATION_TYPES_SQL = `'${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}', '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER}'`;

const IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_BASE_SQL = `
            SELECT
                'AUTO_IBAN_BRIDGE_CANONICAL_SUPERSESSION' as confidenceBucket,
                supersededCanonicalTransactionId,
                canonicalTransactionId,
                sourceAccountId,
                bridgeAccountId,
                targetAccountId,
                sourceAmount,
                timeDiff
            FROM (
                SELECT
                    superseded_tx.id as supersededCanonicalTransactionId,
                    canonical_tx.id as canonicalTransactionId,
                    source_account.id as sourceAccountId,
                    bridge_account.id as bridgeAccountId,
                    target_account.id as targetAccountId,
                    superseded_source_entry.amount as sourceAmount,
                    ABS(canonical_tx.operated_at - superseded_tx.operated_at) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY superseded_tx.id
                        ORDER BY
                            ABS(canonical_tx.operated_at - superseded_tx.operated_at),
                            canonical_tx.id
                    ) as supersededRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY canonical_tx.id
                        ORDER BY
                            ABS(canonical_tx.operated_at - superseded_tx.operated_at),
                            superseded_tx.id
                    ) as canonicalRank
                FROM transactions superseded_tx
                INNER JOIN accounts source_account ON
                    source_account.id = superseded_tx.from_account_id
                    AND source_account.deleted_at IS NULL
                    AND source_account.is_active = 1
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = superseded_tx.to_account_id
                    AND bridge_account.deleted_at IS NULL
                    AND bridge_account.is_active = 1
                    AND bridge_account.iban IS NOT NULL
                    AND bridge_account.iban != ''
                INNER JOIN transaction_entries superseded_source_entry ON
                    superseded_source_entry.transaction_id = superseded_tx.id
                    AND superseded_source_entry.deleted_at IS NULL
                    AND superseded_source_entry.original_transaction_id IS NULL
                    AND superseded_source_entry.account_id = source_account.id
                    AND superseded_source_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND superseded_source_entry.amount > 0
                    AND superseded_source_entry.to_iban = bridge_account.iban
                INNER JOIN transaction_entries superseded_target_entry ON
                    superseded_target_entry.transaction_id = superseded_tx.id
                    AND superseded_target_entry.deleted_at IS NULL
                    AND superseded_target_entry.original_transaction_id IS NULL
                    AND superseded_target_entry.account_id = bridge_account.id
                    AND superseded_target_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND superseded_target_entry.amount > 0
                INNER JOIN transactions canonical_tx ON
                    canonical_tx.id != superseded_tx.id
                    AND canonical_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND canonical_tx.deleted_at IS NULL
                    AND canonical_tx.consolidation_parent_transaction_id IS NULL
                    AND canonical_tx.updated_by IS NULL
                    AND canonical_tx.consolidation_type IN (${IBAN_BRIDGE_CONSOLIDATION_TYPES_SQL})
                    AND canonical_tx.from_account_id = source_account.id
                    AND canonical_tx.to_account_id != bridge_account.id
                    AND canonical_tx.operated_at BETWEEN superseded_tx.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND superseded_tx.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    ${CANONICAL_SCOPE_SQL_PLACEHOLDER}
                INNER JOIN accounts target_account ON
                    target_account.id = canonical_tx.to_account_id
                    AND target_account.deleted_at IS NULL
                    AND target_account.is_active = 1
                INNER JOIN transaction_entries canonical_source_entry ON
                    canonical_source_entry.transaction_id = canonical_tx.id
                    AND canonical_source_entry.deleted_at IS NULL
                    AND canonical_source_entry.original_transaction_id IS NULL
                    AND canonical_source_entry.account_id = source_account.id
                    AND canonical_source_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND canonical_source_entry.amount > 0
                    AND ABS(canonical_source_entry.amount - superseded_source_entry.amount) <= ${CANONICAL_CENT_TOLERANCE_AMOUNT}
                    AND canonical_source_entry.to_iban = bridge_account.iban
                INNER JOIN transaction_entries canonical_bridge_entry ON
                    canonical_bridge_entry.transaction_id = canonical_tx.id
                    AND canonical_bridge_entry.deleted_at IS NULL
                    AND canonical_bridge_entry.original_transaction_id IS NOT NULL
                    AND canonical_bridge_entry.account_id = bridge_account.id
                    AND canonical_bridge_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND canonical_bridge_entry.amount = superseded_target_entry.amount
                WHERE superseded_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND superseded_tx.deleted_at IS NULL
                    AND superseded_tx.consolidation_parent_transaction_id IS NULL
                    AND superseded_tx.updated_by IS NULL
                    AND superseded_tx.consolidation_type IN (${IBAN_BRIDGE_CONSOLIDATION_TYPES_SQL})
                    ${SUPERSEDED_SCOPE_SQL_PLACEHOLDER}
            )
            WHERE supersededRank = 1
                AND canonicalRank = 1
            ORDER BY supersededCanonicalTransactionId, canonicalTransactionId
`;

export const IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL = (scope: ConsolidationScanScopeInterface | null): string =>
    applyConsolidationScanScopeSql(
        IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_BASE_SQL,
        scope,
        IBAN_BRIDGE_CANONICAL_SUPERSESSION_SCOPE_EXPRESSIONS
    );

import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { CANONICAL_CENT_TOLERANCE_AMOUNT } from '../../../shared/constant/canonical-cent-tolerance.constant';
import { TRANSFER_MCC_GROUP_ID } from '../../../shared/constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../../shared/constant/transfer-pair-fast-time-window.constant';
import { applyConsolidationScanScopeSql } from '../../utils/apply-consolidation-scan-scope-sql.util';
import { buildCalibratedTransferExclusionSql } from '../../utils/build-calibrated-transfer-exclusion-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const END_LEG_SCOPE_SQL_PLACEHOLDER = '__IBAN_BRIDGE_END_LEG_SCOPE_SQL__';

const IBAN_BRIDGE_END_LEG_SCOPE_EXPRESSIONS = new Map([[END_LEG_SCOPE_SQL_PLACEHOLDER, 'end_leg_tx.operated_at']]);

const BRIDGE_ENTRY_CONDITION_SQL = `bridge_entry.transaction_id = canonical_tx.id
                            AND bridge_entry.deleted_at IS NULL
                            AND bridge_entry.original_transaction_id IS NOT NULL
                            AND bridge_entry.account_id NOT IN (canonical_tx.from_account_id, canonical_tx.to_account_id)`;

const IBAN_BRIDGE_END_LEG_CANDIDATES_BASE_SQL = `
            WITH invented_legs AS (
                SELECT
                    canonical_tx.id as canonicalTransactionId,
                    canonical_tx.operated_at as canonicalOperatedAt,
                    invented_entry.account_id as accountId,
                    invented_entry.type as entryType,
                    invented_entry.amount as amount,
                    CASE invented_entry.type
                        WHEN '${TransactionEntryTypeEnum.CREDIT}' THEN '${TransactionTypeEnum.EXPENSE}'
                        ELSE '${TransactionTypeEnum.INCOME}'
                    END as transactionType,
                    counterpart_account.iban as counterpartIban,
                    (
                        SELECT bridge_account.iban
                        FROM transaction_entries bridge_entry
                        INNER JOIN accounts bridge_account ON bridge_account.id = bridge_entry.account_id
                        WHERE ${BRIDGE_ENTRY_CONDITION_SQL}
                        LIMIT 1
                    ) as bridgeIban,
                    (
                        SELECT MIN(bridge_entry.original_transaction_id)
                        FROM transaction_entries bridge_entry
                        WHERE ${BRIDGE_ENTRY_CONDITION_SQL}
                    ) as bridgeOriginTransactionId
                FROM transactions canonical_tx
                INNER JOIN transaction_entries invented_entry ON
                    invented_entry.transaction_id = canonical_tx.id
                    AND invented_entry.deleted_at IS NULL
                    AND invented_entry.original_transaction_id IS NULL
                    AND invented_entry.amount > 0
                    AND (
                        (invented_entry.type = '${TransactionEntryTypeEnum.CREDIT}' AND invented_entry.account_id = canonical_tx.from_account_id)
                        OR (invented_entry.type = '${TransactionEntryTypeEnum.DEBIT}' AND invented_entry.account_id = canonical_tx.to_account_id)
                    )
                INNER JOIN accounts counterpart_account ON
                    counterpart_account.id = CASE invented_entry.type
                        WHEN '${TransactionEntryTypeEnum.CREDIT}' THEN canonical_tx.to_account_id
                        ELSE canonical_tx.from_account_id
                    END
                WHERE canonical_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND canonical_tx.deleted_at IS NULL
                    AND canonical_tx.consolidation_parent_transaction_id IS NULL
                    AND canonical_tx.updated_by IS NULL
                    AND canonical_tx.consolidation_type = '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}'
                    AND EXISTS (SELECT 1 FROM transaction_entries bridge_entry WHERE ${BRIDGE_ENTRY_CONDITION_SQL})
                    AND NOT EXISTS (
                        SELECT 1
                        FROM transaction_entries claimed_entry
                        WHERE claimed_entry.transaction_id = canonical_tx.id
                            AND claimed_entry.deleted_at IS NULL
                            AND claimed_entry.original_transaction_id IS NOT NULL
                            AND claimed_entry.account_id = invented_entry.account_id
                    )
            ),
            candidate_rows AS (
                SELECT
                    invented_legs.canonicalTransactionId,
                    invented_legs.bridgeOriginTransactionId,
                    invented_legs.accountId,
                    end_leg_tx.id as endLegTransactionId,
                    ABS(end_leg_tx.operated_at - invented_legs.canonicalOperatedAt) as timeDiff
                FROM invented_legs
                INNER JOIN transaction_entries end_leg_entry ON
                    end_leg_entry.account_id = invented_legs.accountId
                    AND end_leg_entry.type = invented_legs.entryType
                    AND end_leg_entry.deleted_at IS NULL
                    AND end_leg_entry.original_transaction_id IS NULL
                    AND ABS(end_leg_entry.amount - invented_legs.amount) <= ${CANONICAL_CENT_TOLERANCE_AMOUNT}
                    AND (
                        end_leg_entry.to_iban IN (invented_legs.bridgeIban, invented_legs.counterpartIban)
                        OR (end_leg_entry.type = '${TransactionEntryTypeEnum.DEBIT}' AND COALESCE(end_leg_entry.to_iban, '') = '')
                    )
                INNER JOIN transactions end_leg_tx ON
                    end_leg_tx.id = end_leg_entry.transaction_id
                    AND end_leg_tx.type = invented_legs.transactionType
                    AND end_leg_tx.deleted_at IS NULL
                    AND end_leg_tx.consolidation_parent_transaction_id IS NULL
                    AND end_leg_tx.consolidation_type IS NULL
                    AND end_leg_tx.operated_at BETWEEN invented_legs.canonicalOperatedAt - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND invented_legs.canonicalOperatedAt + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    ${END_LEG_SCOPE_SQL_PLACEHOLDER}
                LEFT JOIN mcc_categories end_leg_mcc ON end_leg_mcc.id = end_leg_entry.mcc_category_id
                WHERE (end_leg_mcc.mcc_group_id IS NULL OR end_leg_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND ${buildCalibratedTransferExclusionSql('end_leg_tx', 'invented_legs.accountId')}
            ),
            ranked_rows AS (
                SELECT
                    *,
                    ROW_NUMBER() OVER (
                        PARTITION BY canonicalTransactionId, accountId
                        ORDER BY timeDiff, endLegTransactionId
                    ) as legRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY endLegTransactionId
                        ORDER BY timeDiff, canonicalTransactionId
                    ) as endLegRank
                FROM candidate_rows
            )
            SELECT canonicalTransactionId, bridgeOriginTransactionId, accountId, endLegTransactionId
            FROM ranked_rows
            WHERE legRank = 1
                AND endLegRank = 1
            ORDER BY canonicalTransactionId, accountId
`;

export const IBAN_BRIDGE_END_LEG_CANDIDATES_SQL = (scope: ConsolidationScanScopeInterface | null): string =>
    applyConsolidationScanScopeSql(IBAN_BRIDGE_END_LEG_CANDIDATES_BASE_SQL, scope, IBAN_BRIDGE_END_LEG_SCOPE_EXPRESSIONS);

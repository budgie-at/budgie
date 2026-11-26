import {
    AccountTypeEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { P2P_FIAT_BANK_ACCOUNT_TYPE_SQL } from '../../../shared/constant/p2p-fiat-bank-account-type-sql.constant';
import {
    P2P_ORDER_EXTERNAL_ID_MARKER,
    TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA,
    TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO,
    TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS
} from '../../../shared/constant/transfer-pair-p2p-fiat.constant';
import { buildConsolidationScanScopeSql } from '../../utils/build-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const MAX_SCOPED_TRANSACTION_IDS = 500;

const buildBankQuoteMatchSql = (
    p2pSourceTypeExpression: string,
    quotedAmountExpression: string,
    bankTransactionAlias: string,
    bankEntryAlias: string
): string => `
    (
        ${p2pSourceTypeExpression} = '${TransactionTypeEnum.INCOME}'
        AND ${bankTransactionAlias}.type = '${TransactionTypeEnum.EXPENSE}'
        AND ${bankEntryAlias}.kind = '${TransactionEntryKindEnum.PRIMARY}'
        AND ${bankEntryAlias}.type = '${TransactionEntryTypeEnum.CREDIT}'
        AND ${bankEntryAlias}.amount >= ${quotedAmountExpression}
        AND ${bankEntryAlias}.amount - ${quotedAmountExpression} <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA}
        AND (${bankEntryAlias}.amount - ${quotedAmountExpression}) * 1.0 / ${quotedAmountExpression} <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO}
    )
    OR (
        ${p2pSourceTypeExpression} = '${TransactionTypeEnum.EXPENSE}'
        AND ${bankTransactionAlias}.type = '${TransactionTypeEnum.INCOME}'
        AND ${bankEntryAlias}.kind = '${TransactionEntryKindEnum.PRIMARY}'
        AND ${bankEntryAlias}.type = '${TransactionEntryTypeEnum.DEBIT}'
        AND ${quotedAmountExpression} >= ${bankEntryAlias}.amount
        AND ${quotedAmountExpression} - ${bankEntryAlias}.amount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA}
        AND (${quotedAmountExpression} - ${bankEntryAlias}.amount) * 1.0 / ${quotedAmountExpression} <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO}
    )
`;

const CURRENT_BANK_ENTRY_COUNT_SQL = `
    SELECT COUNT(*)
    FROM transaction_entries bank_entry
    INNER JOIN accounts bank_account
        ON bank_account.id = bank_entry.account_id
        AND bank_account.type IN (${P2P_FIAT_BANK_ACCOUNT_TYPE_SQL})
        AND bank_account.deleted_at IS NULL
        AND bank_account.is_active = 1
    WHERE bank_entry.transaction_id = canonical.id
        AND bank_entry.original_transaction_id IS NOT NULL
        AND bank_entry.deleted_at IS NULL
        AND bank_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
        AND bank_entry.type IN ('${TransactionEntryTypeEnum.CREDIT}','${TransactionEntryTypeEnum.DEBIT}')
`;

const CURRENT_MATCHING_BANK_ENTRY_COUNT_SQL = `
    SELECT COUNT(*)
    FROM transaction_entries bank_entry
    INNER JOIN accounts bank_account
        ON bank_account.id = bank_entry.account_id
        AND bank_account.type IN (${P2P_FIAT_BANK_ACCOUNT_TYPE_SQL})
        AND bank_account.instrument_id = p2p_entry.quoted_instrument_id
        AND bank_account.deleted_at IS NULL
        AND bank_account.is_active = 1
    INNER JOIN transactions bank_source
        ON bank_source.id = bank_entry.original_transaction_id
        AND bank_source.deleted_at IS NULL
    WHERE bank_entry.transaction_id = canonical.id
        AND bank_entry.original_transaction_id IS NOT NULL
        AND bank_entry.deleted_at IS NULL
        AND (${buildBankQuoteMatchSql('p2p_source.type', 'p2p_entry.quoted_amount', 'bank_source', 'bank_entry')})
`;

const REPLACEMENT_MATCHING_BANK_TRANSACTION_COUNT_SQL = `
    SELECT COUNT(DISTINCT replacement_bank_transaction.id)
    FROM transaction_entries replacement_bank_entry
    INNER JOIN transactions replacement_bank_transaction
        ON replacement_bank_transaction.id = replacement_bank_entry.transaction_id
        AND replacement_bank_transaction.deleted_at IS NULL
        AND replacement_bank_transaction.consolidation_parent_transaction_id IS NULL
        AND replacement_bank_transaction.consolidation_type IS NULL
        AND replacement_bank_transaction.operated_at BETWEEN candidate.p2pSourceOperatedAt - ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
            AND candidate.p2pSourceOperatedAt + ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
    INNER JOIN accounts replacement_bank_account
        ON replacement_bank_account.id = replacement_bank_entry.account_id
        AND replacement_bank_account.type IN (${P2P_FIAT_BANK_ACCOUNT_TYPE_SQL})
        AND replacement_bank_account.instrument_id = candidate.quotedInstrumentId
        AND replacement_bank_account.deleted_at IS NULL
        AND replacement_bank_account.is_active = 1
    WHERE replacement_bank_entry.deleted_at IS NULL
        AND replacement_bank_entry.original_transaction_id IS NULL
        AND replacement_bank_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
        AND (${buildBankQuoteMatchSql('candidate.p2pSourceType', 'candidate.quotedAmount', 'replacement_bank_transaction', 'replacement_bank_entry')})
`;

const SCOPED_EXISTING_SOURCE_CONDITION_SQL = `
    (
        p2p_source.id IN (SELECT id FROM scoped_ids)
        OR EXISTS (
            SELECT 1
            FROM transaction_entries scoped_bank_entry
            INNER JOIN accounts scoped_bank_account
                ON scoped_bank_account.id = scoped_bank_entry.account_id
                AND scoped_bank_account.type IN (${P2P_FIAT_BANK_ACCOUNT_TYPE_SQL})
                AND scoped_bank_account.deleted_at IS NULL
                AND scoped_bank_account.is_active = 1
            WHERE scoped_bank_entry.transaction_id = canonical.id
                AND scoped_bank_entry.original_transaction_id IN (SELECT id FROM scoped_ids)
                AND scoped_bank_entry.deleted_at IS NULL
                AND scoped_bank_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
        )
    )
`;

const SCOPED_REPLACEMENT_SOURCE_CONDITION_SQL = `
    (
        ${SCOPED_EXISTING_SOURCE_CONDITION_SQL}
        OR EXISTS (
            SELECT 1
            FROM transaction_entries scoped_replacement_bank_entry
            INNER JOIN transactions scoped_replacement_bank_transaction
                ON scoped_replacement_bank_transaction.id = scoped_replacement_bank_entry.transaction_id
                AND scoped_replacement_bank_transaction.deleted_at IS NULL
                AND scoped_replacement_bank_transaction.consolidation_parent_transaction_id IS NULL
                AND scoped_replacement_bank_transaction.consolidation_type IS NULL
                AND scoped_replacement_bank_transaction.id IN (SELECT id FROM scoped_ids)
                AND scoped_replacement_bank_transaction.operated_at BETWEEN p2p_source.operated_at - ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
                    AND p2p_source.operated_at + ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
            INNER JOIN accounts scoped_replacement_bank_account
                ON scoped_replacement_bank_account.id = scoped_replacement_bank_entry.account_id
                AND scoped_replacement_bank_account.type IN (${P2P_FIAT_BANK_ACCOUNT_TYPE_SQL})
                AND scoped_replacement_bank_account.instrument_id = p2p_entry.quoted_instrument_id
                AND scoped_replacement_bank_account.deleted_at IS NULL
                AND scoped_replacement_bank_account.is_active = 1
            WHERE scoped_replacement_bank_entry.deleted_at IS NULL
                AND scoped_replacement_bank_entry.original_transaction_id IS NULL
                AND scoped_replacement_bank_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                AND (${buildBankQuoteMatchSql('p2p_source.type', 'p2p_entry.quoted_amount', 'scoped_replacement_bank_transaction', 'scoped_replacement_bank_entry')})
        )
    )
`;

export const buildP2pFiatAuthoritativeRepairCandidateSql = (scope: ConsolidationScanScopeInterface | null): string => {
    if (isDefined(scope) && !isNotEmptyArray(scope.transactionIds)) {
        return 'SELECT id AS canonicalTransactionId FROM transactions WHERE 0 = 1';
    }

    const useScopedIdsCte = isDefined(scope) && scope.transactionIds.length <= MAX_SCOPED_TRANSACTION_IDS;
    const scopedIdsCteSql = useScopedIdsCte
        ? `scoped_ids(id) AS MATERIALIZED (VALUES ${scope.transactionIds.map(id => `(${id})`).join(', ')}),`
        : '';
    const existingScopeFlagSql = useScopedIdsCte ? `CASE WHEN ${SCOPED_EXISTING_SOURCE_CONDITION_SQL} THEN 1 ELSE 0 END` : '1';
    const replacementScopeFlagSql = useScopedIdsCte ? `CASE WHEN ${SCOPED_REPLACEMENT_SOURCE_CONDITION_SQL} THEN 1 ELSE 0 END` : '1';

    return `
        WITH ${scopedIdsCteSql}
        candidate_canonicals AS (
            SELECT
                canonical.id AS canonicalTransactionId,
                p2p_source.type AS p2pSourceType,
                p2p_source.operated_at AS p2pSourceOperatedAt,
                p2p_entry.quoted_instrument_id AS quotedInstrumentId,
                p2p_entry.quoted_amount AS quotedAmount,
                (${CURRENT_BANK_ENTRY_COUNT_SQL}) AS currentBankEntryCount,
                (${CURRENT_MATCHING_BANK_ENTRY_COUNT_SQL}) AS currentMatchingBankEntryCount,
                ${existingScopeFlagSql} AS matchesExistingScope,
                ${replacementScopeFlagSql} AS matchesReplacementScope
            FROM transactions canonical
            INNER JOIN transaction_entries p2p_entry
                ON p2p_entry.transaction_id = canonical.id
                AND p2p_entry.original_transaction_id IS NOT NULL
                AND p2p_entry.deleted_at IS NULL
                AND p2p_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                AND p2p_entry.amount > 0
                AND p2p_entry.quoted_instrument_id IS NOT NULL
                AND p2p_entry.quoted_amount > 0
                AND p2p_entry.quoted_unit_price > 0
            INNER JOIN accounts p2p_account
                ON p2p_account.id = p2p_entry.account_id
                AND p2p_account.type = '${AccountTypeEnum.CRYPTO_SYNC}'
                AND p2p_account.deleted_at IS NULL
                AND p2p_account.is_active = 1
            INNER JOIN transactions p2p_source
                ON p2p_source.id = p2p_entry.original_transaction_id
                AND p2p_source.deleted_at IS NULL
                AND p2p_source.external_id LIKE '%${P2P_ORDER_EXTERNAL_ID_MARKER}%'
                ${buildConsolidationScanScopeSql(scope, 'p2p_source.operated_at')}
            WHERE canonical.type = '${TransactionTypeEnum.TRANSFER}'
                AND canonical.consolidation_type = '${TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER}'
                AND canonical.consolidation_parent_transaction_id IS NULL
                AND canonical.updated_by IS NULL
                AND canonical.deleted_at IS NULL
                AND (
                    (
                        p2p_source.type = '${TransactionTypeEnum.INCOME}'
                        AND p2p_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    )
                    OR (
                        p2p_source.type = '${TransactionTypeEnum.EXPENSE}'
                        AND p2p_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    )
                )
        )
        SELECT DISTINCT candidate.canonicalTransactionId
        FROM candidate_canonicals candidate
        WHERE (
            candidate.matchesExistingScope = 1
            AND candidate.currentBankEntryCount != 1
            AND candidate.currentMatchingBankEntryCount = 1
        )
        OR (
            candidate.matchesReplacementScope = 1
            AND candidate.currentBankEntryCount = 1
            AND candidate.currentMatchingBankEntryCount = 0
            AND (${REPLACEMENT_MATCHING_BANK_TRANSACTION_COUNT_SQL}) = 1
        )
    `;
};

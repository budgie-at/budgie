import { AccountTypeEnum, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA,
    TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO,
    TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS
} from '../../../shared/constant/transfer-pair-p2p-fiat.constant';
import { applyConsolidationScanScopeSql } from '../../utils/apply-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const P2P_SOURCE_SCOPE_SQL_PLACEHOLDER = '__P2P_REPAIR_SOURCE_SCOPE_SQL__';
const REPLACEMENT_BANK_SCOPE_SQL_PLACEHOLDER = '__P2P_REPAIR_REPLACEMENT_BANK_SCOPE_SQL__';
const EXISTING_SOURCE_IDS_SCOPE_SQL_PLACEHOLDER = '__P2P_REPAIR_EXISTING_SOURCE_IDS_SCOPE_SQL__';
const REPLACEMENT_SOURCE_IDS_SCOPE_SQL_PLACEHOLDER = '__P2P_REPAIR_REPLACEMENT_SOURCE_IDS_SCOPE_SQL__';
const SCOPE_EXPRESSIONS = new Map([
    [P2P_SOURCE_SCOPE_SQL_PLACEHOLDER, 'p2p_source.operated_at'],
    [REPLACEMENT_BANK_SCOPE_SQL_PLACEHOLDER, 'replacement_bank_transaction.operated_at']
]);
const buildBankQuoteMatchSql = (bankTransactionAlias: string, bankEntryAlias: string): string => `
    (
        p2p_source.type = '${TransactionTypeEnum.INCOME}'
        AND ${bankTransactionAlias}.type = '${TransactionTypeEnum.EXPENSE}'
        AND ${bankEntryAlias}.amount >= p2p_entry.quoted_amount
        AND ${bankEntryAlias}.amount - p2p_entry.quoted_amount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA}
        AND (${bankEntryAlias}.amount - p2p_entry.quoted_amount) * 1.0 / p2p_entry.quoted_amount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO}
    )
    OR (
        p2p_source.type = '${TransactionTypeEnum.EXPENSE}'
        AND ${bankTransactionAlias}.type = '${TransactionTypeEnum.INCOME}'
        AND p2p_entry.quoted_amount >= ${bankEntryAlias}.amount
        AND p2p_entry.quoted_amount - ${bankEntryAlias}.amount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA}
        AND (p2p_entry.quoted_amount - ${bankEntryAlias}.amount) * 1.0 / p2p_entry.quoted_amount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO}
    )
`;
const CURRENT_BANK_ENTRY_COUNT_SQL = `
    SELECT COUNT(*)
    FROM transaction_entries bank_entry
    INNER JOIN accounts bank_account
        ON bank_account.id = bank_entry.account_id
        AND bank_account.type != '${AccountTypeEnum.CRYPTO_SYNC}'
        AND bank_account.deleted_at IS NULL
        AND bank_account.is_active = 1
    WHERE bank_entry.transaction_id = canonical.id
        AND bank_entry.original_transaction_id IS NOT NULL
        AND bank_entry.deleted_at IS NULL
`;
const CURRENT_MATCHING_BANK_ENTRY_COUNT_SQL = `
    SELECT COUNT(*)
    FROM transaction_entries bank_entry
    INNER JOIN accounts bank_account
        ON bank_account.id = bank_entry.account_id
        AND bank_account.type != '${AccountTypeEnum.CRYPTO_SYNC}'
        AND bank_account.instrument_id = p2p_entry.quoted_instrument_id
        AND bank_account.deleted_at IS NULL
        AND bank_account.is_active = 1
    INNER JOIN transactions bank_source
        ON bank_source.id = bank_entry.original_transaction_id
        AND bank_source.deleted_at IS NULL
    WHERE bank_entry.transaction_id = canonical.id
        AND bank_entry.original_transaction_id IS NOT NULL
        AND bank_entry.deleted_at IS NULL
        AND (${buildBankQuoteMatchSql('bank_source', 'bank_entry')})
`;
const REPLACEMENT_MATCHING_BANK_TRANSACTION_COUNT_SQL = `
    SELECT COUNT(DISTINCT replacement_bank_transaction.id)
    FROM transaction_entries replacement_bank_entry
    INNER JOIN transactions replacement_bank_transaction
        ON replacement_bank_transaction.id = replacement_bank_entry.transaction_id
        AND replacement_bank_transaction.deleted_at IS NULL
        AND replacement_bank_transaction.consolidation_parent_transaction_id IS NULL
        ${REPLACEMENT_BANK_SCOPE_SQL_PLACEHOLDER}
    INNER JOIN accounts replacement_bank_account
        ON replacement_bank_account.id = replacement_bank_entry.account_id
        AND replacement_bank_account.type != '${AccountTypeEnum.CRYPTO_SYNC}'
        AND replacement_bank_account.instrument_id = p2p_entry.quoted_instrument_id
        AND replacement_bank_account.deleted_at IS NULL
        AND replacement_bank_account.is_active = 1
    WHERE replacement_bank_entry.deleted_at IS NULL
        AND replacement_bank_entry.original_transaction_id IS NULL
        AND ABS(p2p_source.operated_at - replacement_bank_transaction.operated_at) <= ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
        AND (${buildBankQuoteMatchSql('replacement_bank_transaction', 'replacement_bank_entry')})
`;
const buildScopedReplacementBankTransactionSql = (transactionIdsSql: string): string => `
    EXISTS (
        SELECT 1
        FROM transaction_entries scoped_replacement_bank_entry
        INNER JOIN transactions scoped_replacement_bank_transaction
            ON scoped_replacement_bank_transaction.id = scoped_replacement_bank_entry.transaction_id
            AND scoped_replacement_bank_transaction.deleted_at IS NULL
            AND scoped_replacement_bank_transaction.consolidation_parent_transaction_id IS NULL
            AND scoped_replacement_bank_transaction.id IN (${transactionIdsSql})
        INNER JOIN accounts scoped_replacement_bank_account
            ON scoped_replacement_bank_account.id = scoped_replacement_bank_entry.account_id
            AND scoped_replacement_bank_account.type != '${AccountTypeEnum.CRYPTO_SYNC}'
            AND scoped_replacement_bank_account.instrument_id = p2p_entry.quoted_instrument_id
            AND scoped_replacement_bank_account.deleted_at IS NULL
            AND scoped_replacement_bank_account.is_active = 1
        WHERE scoped_replacement_bank_entry.deleted_at IS NULL
            AND scoped_replacement_bank_entry.original_transaction_id IS NULL
            AND ABS(p2p_source.operated_at - scoped_replacement_bank_transaction.operated_at) <= ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
            AND (${buildBankQuoteMatchSql('scoped_replacement_bank_transaction', 'scoped_replacement_bank_entry')})
    )
`;
const SQL = `
    SELECT DISTINCT canonical.id AS canonicalTransactionId
    FROM transactions canonical
    INNER JOIN transaction_entries p2p_entry
        ON p2p_entry.transaction_id = canonical.id
        AND p2p_entry.original_transaction_id IS NOT NULL
        AND p2p_entry.deleted_at IS NULL
        AND p2p_entry.quoted_instrument_id IS NOT NULL
        AND p2p_entry.quoted_amount > 0
    INNER JOIN accounts p2p_account
        ON p2p_account.id = p2p_entry.account_id
        AND p2p_account.type = '${AccountTypeEnum.CRYPTO_SYNC}'
        AND p2p_account.deleted_at IS NULL
        AND p2p_account.is_active = 1
    INNER JOIN transactions p2p_source
        ON p2p_source.id = p2p_entry.original_transaction_id
        AND p2p_source.deleted_at IS NULL
        ${P2P_SOURCE_SCOPE_SQL_PLACEHOLDER}
    WHERE canonical.consolidation_type = '${TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER}'
        AND canonical.updated_by IS NULL
        AND canonical.deleted_at IS NULL
        AND (
            (
                ${EXISTING_SOURCE_IDS_SCOPE_SQL_PLACEHOLDER}
                AND (${CURRENT_BANK_ENTRY_COUNT_SQL}) != 1
                AND (${CURRENT_MATCHING_BANK_ENTRY_COUNT_SQL}) = 1
            )
            OR (
                ${REPLACEMENT_SOURCE_IDS_SCOPE_SQL_PLACEHOLDER}
                AND (${CURRENT_BANK_ENTRY_COUNT_SQL}) = 1
                AND (${CURRENT_MATCHING_BANK_ENTRY_COUNT_SQL}) = 0
                AND (${REPLACEMENT_MATCHING_BANK_TRANSACTION_COUNT_SQL}) = 1
            )
        )
`;

const buildSourceIdsScopeSql = (
    scope: ConsolidationScanScopeInterface | null,
    buildScopedSql: (transactionIdsSql: string) => string
): string => {
    if (!isDefined(scope)) {
        return '1 = 1';
    }

    if (!isNotEmptyArray(scope.transactionIds)) {
        return '0 = 1';
    }

    const transactionIdsSql = scope.transactionIds.join(',');

    return buildScopedSql(transactionIdsSql);
};

const buildExistingSourceIdsScopeSql = (scope: ConsolidationScanScopeInterface | null): string =>
    buildSourceIdsScopeSql(
        scope,
        transactionIdsSql => `
        (
            p2p_source.id IN (${transactionIdsSql})
            OR EXISTS (
                SELECT 1
                FROM transaction_entries scoped_bank_entry
                INNER JOIN accounts scoped_bank_account
                    ON scoped_bank_account.id = scoped_bank_entry.account_id
                    AND scoped_bank_account.type != '${AccountTypeEnum.CRYPTO_SYNC}'
                    AND scoped_bank_account.deleted_at IS NULL
                    AND scoped_bank_account.is_active = 1
                WHERE scoped_bank_entry.transaction_id = canonical.id
                    AND scoped_bank_entry.original_transaction_id IN (${transactionIdsSql})
                    AND scoped_bank_entry.deleted_at IS NULL
            )
        )
    `
    );

const buildReplacementSourceIdsScopeSql = (scope: ConsolidationScanScopeInterface | null): string =>
    buildSourceIdsScopeSql(
        scope,
        transactionIdsSql => `
        (
            ${buildExistingSourceIdsScopeSql(scope)}
            OR ${buildScopedReplacementBankTransactionSql(transactionIdsSql)}
        )
    `
    );

export const buildP2pFiatAuthoritativeRepairCandidateSql = (scope: ConsolidationScanScopeInterface | null): string =>
    applyConsolidationScanScopeSql(
        SQL.replaceAll(EXISTING_SOURCE_IDS_SCOPE_SQL_PLACEHOLDER, buildExistingSourceIdsScopeSql(scope)).replaceAll(
            REPLACEMENT_SOURCE_IDS_SCOPE_SQL_PLACEHOLDER,
            buildReplacementSourceIdsScopeSql(scope)
        ),
        scope,
        SCOPE_EXPRESSIONS
    );

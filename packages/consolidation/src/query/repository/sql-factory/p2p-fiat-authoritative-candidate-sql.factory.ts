import { AccountTypeEnum, PRECISION, TransactionTypeEnum } from '@budgie/contracts';

import {
    TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA,
    TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO,
    TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS,
    P2P_ORDER_EXTERNAL_ID_MARKER
} from '../../../shared/constant/transfer-pair-p2p-fiat.constant';
import { applyConsolidationScanScopeSql } from '../../utils/apply-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const P2P_SCOPE_SQL_PLACEHOLDER = '__P2P_AUTHORITATIVE_SCOPE_SQL__';
const BANK_SCOPE_SQL_PLACEHOLDER = '__BANK_AUTHORITATIVE_SCOPE_SQL__';
const SCOPE_EXPRESSIONS = new Map([
    [P2P_SCOPE_SQL_PLACEHOLDER, 'p2p_transaction.operated_at'],
    [BANK_SCOPE_SQL_PLACEHOLDER, 'bank_transaction.operated_at']
]);

const SQL = `
    WITH p2p_entries AS (
        SELECT
            p2p_transaction.id AS transactionId,
            p2p_transaction.type AS transactionType,
            p2p_transaction.operated_at AS operatedAt,
            p2p_entry.account_id AS accountId,
            p2p_entry.amount AS amount,
            p2p_entry.exchange_rate AS exchangeRate,
            p2p_entry.to_iban AS toIban,
            p2p_entry.quoted_amount AS quotedAmount,
            p2p_entry.quoted_unit_price AS quotedUnitPrice,
            p2p_entry.quoted_instrument_id AS quotedInstrumentId,
            p2p_account.type AS accountType,
            p2p_instrument.code AS currency
        FROM transaction_entries p2p_entry
        INNER JOIN transactions p2p_transaction
            ON p2p_transaction.id = p2p_entry.transaction_id
            AND p2p_transaction.deleted_at IS NULL
            AND p2p_transaction.consolidation_parent_transaction_id IS NULL
        INNER JOIN accounts p2p_account
            ON p2p_account.id = p2p_entry.account_id
            AND p2p_account.type = '${AccountTypeEnum.CRYPTO_SYNC}'
            AND p2p_account.deleted_at IS NULL
            AND p2p_account.is_active = 1
        INNER JOIN instruments p2p_instrument ON p2p_instrument.id = p2p_account.instrument_id
        WHERE p2p_entry.deleted_at IS NULL
            AND p2p_entry.original_transaction_id IS NULL
            AND p2p_transaction.external_id LIKE '%${P2P_ORDER_EXTERNAL_ID_MARKER}%'
            AND p2p_entry.quoted_instrument_id IS NOT NULL
            AND p2p_entry.quoted_amount > 0
            AND p2p_entry.quoted_unit_price > 0
            ${P2P_SCOPE_SQL_PLACEHOLDER}
    ),
    bank_entries AS (
        SELECT
            bank_transaction.id AS transactionId,
            bank_transaction.type AS transactionType,
            bank_transaction.operated_at AS operatedAt,
            bank_entry.account_id AS accountId,
            bank_entry.amount AS amount,
            bank_entry.exchange_rate AS exchangeRate,
            bank_entry.to_iban AS toIban,
            bank_account.type AS accountType,
            bank_account.instrument_id AS instrumentId,
            bank_instrument.code AS currency
        FROM transaction_entries bank_entry
        INNER JOIN transactions bank_transaction
            ON bank_transaction.id = bank_entry.transaction_id
            AND bank_transaction.deleted_at IS NULL
            AND bank_transaction.consolidation_parent_transaction_id IS NULL
        INNER JOIN accounts bank_account
            ON bank_account.id = bank_entry.account_id
            AND bank_account.type != '${AccountTypeEnum.CRYPTO_SYNC}'
            AND bank_account.deleted_at IS NULL
            AND bank_account.is_active = 1
        INNER JOIN instruments bank_instrument ON bank_instrument.id = bank_account.instrument_id
        WHERE bank_entry.deleted_at IS NULL
            AND bank_entry.original_transaction_id IS NULL
            ${BANK_SCOPE_SQL_PLACEHOLDER}
    ),
    authoritative_pairs AS (
        SELECT
            bank.transactionId AS expenseTransactionId,
            bank.operatedAt AS expenseOperatedAt,
            bank.accountId AS expenseEntryAccountId,
            bank.amount AS expenseEntryAmount,
            bank.exchangeRate AS expenseEntryExchangeRate,
            bank.toIban AS expenseEntryToIban,
            bank.accountType AS expenseAccountType,
            bank.currency AS expenseCurrency,
            p2p.transactionId AS incomeTransactionId,
            p2p.operatedAt AS incomeOperatedAt,
            p2p.accountId AS incomeEntryAccountId,
            p2p.amount AS incomeEntryAmount,
            p2p.exchangeRate AS incomeEntryExchangeRate,
            p2p.toIban AS incomeEntryToIban,
            p2p.accountType AS incomeAccountType,
            p2p.currency AS incomeCurrency,
            ${PRECISION} * 1.0 / p2p.quotedUnitPrice AS expectedExchangeRate,
            ABS(p2p.operatedAt - bank.operatedAt) AS timeDiff,
            p2p.quotedAmount AS quotedAmount,
            bank.amount - p2p.quotedAmount AS quoteDelta
        FROM p2p_entries p2p
        INNER JOIN bank_entries bank
            ON p2p.transactionType = '${TransactionTypeEnum.INCOME}'
            AND bank.transactionType = '${TransactionTypeEnum.EXPENSE}'
            AND bank.instrumentId = p2p.quotedInstrumentId
            AND ABS(p2p.operatedAt - bank.operatedAt) <= ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
            AND bank.amount >= p2p.quotedAmount
            AND bank.amount - p2p.quotedAmount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA}
            AND (bank.amount - p2p.quotedAmount) * 1.0 / p2p.quotedAmount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO}
        UNION ALL
        SELECT
            p2p.transactionId,
            p2p.operatedAt,
            p2p.accountId,
            p2p.amount,
            p2p.exchangeRate,
            p2p.toIban,
            p2p.accountType,
            p2p.currency,
            bank.transactionId,
            bank.operatedAt,
            bank.accountId,
            bank.amount,
            bank.exchangeRate,
            bank.toIban,
            bank.accountType,
            bank.currency,
            p2p.quotedUnitPrice * 1.0 / ${PRECISION},
            ABS(p2p.operatedAt - bank.operatedAt),
            p2p.quotedAmount,
            p2p.quotedAmount - bank.amount
        FROM p2p_entries p2p
        INNER JOIN bank_entries bank
            ON p2p.transactionType = '${TransactionTypeEnum.EXPENSE}'
            AND bank.transactionType = '${TransactionTypeEnum.INCOME}'
            AND bank.instrumentId = p2p.quotedInstrumentId
            AND ABS(p2p.operatedAt - bank.operatedAt) <= ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
            AND p2p.quotedAmount >= bank.amount
            AND p2p.quotedAmount - bank.amount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA}
            AND (p2p.quotedAmount - bank.amount) * 1.0 / p2p.quotedAmount <= ${TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO}
    )
    SELECT * FROM authoritative_pairs
`;

export const buildP2pFiatAuthoritativeCandidateSql = (scope: ConsolidationScanScopeInterface | null): string =>
    applyConsolidationScanScopeSql(SQL, scope, SCOPE_EXPRESSIONS);

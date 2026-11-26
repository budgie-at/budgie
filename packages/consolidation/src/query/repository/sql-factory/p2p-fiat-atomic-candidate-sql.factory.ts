import {
    AccountTypeEnum,
    InstrumentTypeEnum,
    REFUND_TITLE_PREFIXES,
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { P2P_FIAT_BANK_ACCOUNT_TYPE_SQL } from '../../../shared/constant/p2p-fiat-bank-account-type-sql.constant';
import {
    P2P_ORDER_EXTERNAL_ID_MARKER,
    TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS
} from '../../../shared/constant/transfer-pair-p2p-fiat.constant';
import { buildPrefixLikeSql } from '../../../shared/utils/build-prefix-like-sql.util';
import { buildNotRejectedPaymentRefundSql } from '../../utils/build-not-rejected-payment-refund-sql.util';
import { operatedAtScopeSql } from '../../utils/operated-at-scope-sql.util';
import { scopedSql } from '../../utils/scoped-sql.util';

import { TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL } from './transfer-pair-available-exchange-rates-sql.factory';

export const buildP2pFiatAtomicCandidateSql = scopedSql`
    WITH p2p_entries AS MATERIALIZED (
        SELECT
            p2p_transaction.id AS transactionId,
            p2p_transaction.type AS transactionType,
            p2p_transaction.operated_at AS operatedAt,
            p2p_entry.account_id AS accountId,
            p2p_entry.amount AS amount,
            p2p_entry.exchange_rate AS exchangeRate,
            p2p_entry.to_iban AS toIban,
            p2p_entry.quoted_instrument_id AS quotedInstrumentId,
            p2p_account.type AS accountType,
            p2p_account.instrument_id AS instrumentId,
            p2p_instrument.code AS currency
        FROM transaction_entries p2p_entry
        INNER JOIN transactions p2p_transaction
            ON p2p_transaction.id = p2p_entry.transaction_id
            AND p2p_transaction.type IN ('${TransactionTypeEnum.EXPENSE}', '${TransactionTypeEnum.INCOME}')
            AND p2p_transaction.deleted_at IS NULL
            AND p2p_transaction.consolidation_parent_transaction_id IS NULL
            AND p2p_transaction.consolidation_type IS NOT '${TransactionConsolidationTypeEnum.REFUND}'
            AND p2p_transaction.external_id LIKE '%${P2P_ORDER_EXTERNAL_ID_MARKER}%'
        INNER JOIN accounts p2p_account
            ON p2p_account.id = p2p_entry.account_id
            AND p2p_account.type = '${AccountTypeEnum.CRYPTO_SYNC}'
            AND p2p_account.deleted_at IS NULL
            AND p2p_account.is_active = 1
        INNER JOIN instruments p2p_instrument ON p2p_instrument.id = p2p_account.instrument_id
        WHERE p2p_entry.deleted_at IS NULL
            AND p2p_entry.original_transaction_id IS NULL
            AND p2p_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
            AND p2p_entry.amount > 0
            AND p2p_entry.exchange_rate > 0
            AND (
                (p2p_transaction.type = '${TransactionTypeEnum.INCOME}' AND p2p_entry.type = '${TransactionEntryTypeEnum.DEBIT}')
                OR (p2p_transaction.type = '${TransactionTypeEnum.EXPENSE}' AND p2p_entry.type = '${TransactionEntryTypeEnum.CREDIT}')
            )
            ${operatedAtScopeSql('p2p_transaction.operated_at')}
    ),
    p2p_bounds AS (
        SELECT
            MIN(operatedAt) - ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS} AS operatedAtFrom,
            MAX(operatedAt) + ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS} AS operatedAtTo
        FROM p2p_entries
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
            bank_instrument.type AS instrumentType,
            bank_instrument.code AS currency
        FROM p2p_bounds
        INNER JOIN transactions bank_transaction
            ON bank_transaction.type IN ('${TransactionTypeEnum.EXPENSE}', '${TransactionTypeEnum.INCOME}')
            AND bank_transaction.deleted_at IS NULL
            AND bank_transaction.consolidation_parent_transaction_id IS NULL
            AND bank_transaction.consolidation_type IS NOT '${TransactionConsolidationTypeEnum.REFUND}'
            AND bank_transaction.operated_at BETWEEN p2p_bounds.operatedAtFrom AND p2p_bounds.operatedAtTo
            ${operatedAtScopeSql('bank_transaction.operated_at')}
        INNER JOIN transaction_entries bank_entry
            ON bank_entry.transaction_id = bank_transaction.id
            AND bank_entry.deleted_at IS NULL
            AND bank_entry.original_transaction_id IS NULL
            AND bank_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
            AND bank_entry.amount > 0
            AND bank_entry.exchange_rate > 0
            AND (
                (bank_transaction.type = '${TransactionTypeEnum.EXPENSE}' AND bank_entry.type = '${TransactionEntryTypeEnum.CREDIT}')
                OR (bank_transaction.type = '${TransactionTypeEnum.INCOME}' AND bank_entry.type = '${TransactionEntryTypeEnum.DEBIT}')
            )
        INNER JOIN accounts bank_account
            ON bank_account.id = bank_entry.account_id
            AND bank_account.type IN (${P2P_FIAT_BANK_ACCOUNT_TYPE_SQL})
            AND bank_account.deleted_at IS NULL
            AND bank_account.is_active = 1
        INNER JOIN instruments bank_instrument ON bank_instrument.id = bank_account.instrument_id
        WHERE NOT (
            bank_transaction.type = '${TransactionTypeEnum.INCOME}'
            AND ${buildPrefixLikeSql('bank_transaction.title', [...REFUND_TITLE_PREFIXES.rejectedPaymentPrincipal, ...REFUND_TITLE_PREFIXES.rejectedPaymentFee])}
        )
        AND (
            bank_transaction.type != '${TransactionTypeEnum.EXPENSE}'
            OR ${buildNotRejectedPaymentRefundSql('bank_entry.account_id', 'bank_entry.amount', 'bank_transaction.operated_at')}
        )
    ),
    ${TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL}
    p2p_fiat_atomic_candidates AS (
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
            aer.rate AS expectedExchangeRate,
            ABS(p2p.operatedAt - bank.operatedAt) AS timeDiff
        FROM p2p_entries p2p
        INNER JOIN bank_entries bank
            ON p2p.transactionType = '${TransactionTypeEnum.INCOME}'
            AND bank.transactionType = '${TransactionTypeEnum.EXPENSE}'
            AND bank.accountId != p2p.accountId
            AND bank.instrumentId != p2p.instrumentId
            AND bank.operatedAt BETWEEN p2p.operatedAt - ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
                AND p2p.operatedAt + ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
            AND (
                bank.instrumentId = p2p.quotedInstrumentId
                OR (p2p.quotedInstrumentId IS NULL AND bank.instrumentType = '${InstrumentTypeEnum.FIAT}')
            )
        INNER JOIN available_exchange_rates aer
            ON aer.base_instrument_id = bank.instrumentId
            AND aer.quote_instrument_id = p2p.instrumentId
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
            aer.rate,
            ABS(bank.operatedAt - p2p.operatedAt)
        FROM p2p_entries p2p
        INNER JOIN bank_entries bank
            ON p2p.transactionType = '${TransactionTypeEnum.EXPENSE}'
            AND bank.transactionType = '${TransactionTypeEnum.INCOME}'
            AND bank.accountId != p2p.accountId
            AND p2p.instrumentId != bank.instrumentId
            AND bank.operatedAt BETWEEN p2p.operatedAt - ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
                AND p2p.operatedAt + ${TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS}
            AND (
                bank.instrumentId = p2p.quotedInstrumentId
                OR (p2p.quotedInstrumentId IS NULL AND bank.instrumentType = '${InstrumentTypeEnum.FIAT}')
            )
        INNER JOIN available_exchange_rates aer
            ON aer.base_instrument_id = p2p.instrumentId
            AND aer.quote_instrument_id = bank.instrumentId
    )
    SELECT * FROM p2p_fiat_atomic_candidates
`;

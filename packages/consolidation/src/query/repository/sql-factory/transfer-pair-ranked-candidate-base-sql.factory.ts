import {
    ExternalSourceEnum,
    REFUND_TITLE_PREFIXES,
    TRANSFER_PAIR_TIME_WINDOW_SECONDS,
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { CANONICAL_CENT_TOLERANCE_AMOUNT } from '../../../shared/constant/canonical-cent-tolerance.constant';
import { TRANSFER_MCC_GROUP_ID } from '../../../shared/constant/transfer-mcc-group-id.constant';
import {
    TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH,
    TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA,
    TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA_RATIO,
    TRANSFER_PAIR_SAME_BANK_HINTED_FEE_MAX_AMOUNT_DELTA,
    TRANSFER_PAIR_SAME_BANK_HINTED_FEE_MAX_AMOUNT_DELTA_RATIO
} from '../../../shared/constant/transfer-pair-hinted-fee.constant';
import { buildPrefixLikeSql } from '../../../shared/utils/build-prefix-like-sql.util';
import { operatedAtScopeSql } from '../../utils/operated-at-scope-sql.util';
import { scopedSql } from '../../utils/scoped-sql.util';

import { TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL } from './transfer-pair-available-exchange-rates-sql.factory';

const buildNoMovedSourceEntriesSql = (transactionAlias: string): string => `NOT EXISTS (
                        SELECT 1
                        FROM transaction_entries moved_entry INDEXED BY transaction_entries_refund_tx_idx
                        WHERE moved_entry.transaction_id = ${transactionAlias}.id
                            AND moved_entry.deleted_at IS NULL
                            AND moved_entry.original_transaction_id IS NOT NULL
                    )`;

export const buildTransferPairRankedCandidateBaseSql = scopedSql`
            WITH expense_entries AS (
                SELECT
                    expense_entry.id as expenseEntryId,
                    expense_entry.transaction_id as expenseTransactionId,
                    expense_entry.account_id as expenseAccountId,
                    expense_entry.amount as expenseEntryAmount,
                    expense_entry.exchange_rate as expenseEntryExchangeRate,
                    expense_entry.amount * 1.0 / expense_entry.exchange_rate as expenseOperationAmount,
                    expense_entry.to_iban as expenseEntryToIban,
                    expense_tx.title as expenseTransactionTitle,
                    expense_tx.comment as expenseTransactionComment,
                    expense_tx.operated_at as expenseOperatedAt,
                    expense_account.title as expenseAccountTitle,
                    expense_account.iban as expenseAccountIban,
                    expense_account.sync_zone as expenseAccountSyncZone,
                    expense_account.instrument_id as expenseInstrumentId,
                    expense_account.external_source as expenseExternalSource,
                    CASE WHEN expense_account.external_source = '${ExternalSourceEnum.ENABLE_BANKING}' AND expense_account.integration_id IS NOT NULL THEN '${ExternalSourceEnum.ENABLE_BANKING}:' || expense_account.integration_id ELSE COALESCE(NULLIF(expense_account.external_source, ''), expense_tx.external_source) END as expenseBankSource,
                    SUBSTR(expense_account.iban, -${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}) as expenseAccountHintSuffix,
                    CASE
                        WHEN expense_account.iban IS NOT NULL
                            AND LENGTH(expense_account.iban) > ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}
                        THEN SUBSTR(expense_account.iban, 1, LENGTH(expense_account.iban) - ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH})
                        ELSE NULL
                    END as expenseAccountBankHint,
                    expense_instrument.code as expenseCurrency,
                    expense_mcc.mcc_group_id as expenseMccGroupId
                FROM transaction_entries expense_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                INNER JOIN transactions expense_tx ON
                    expense_entry.transaction_id = expense_tx.id
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts expense_account ON
                    expense_entry.account_id = expense_account.id
                    AND expense_account.deleted_at IS NULL
                    AND expense_account.is_active = 1
                INNER JOIN instruments expense_instrument ON expense_account.instrument_id = expense_instrument.id
                LEFT JOIN mcc_categories expense_mcc ON expense_entry.mcc_category_id = expense_mcc.id
                WHERE expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                    AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND expense_entry.amount > 0
                    AND expense_entry.exchange_rate > 0
                    AND expense_tx.consolidation_type IS NOT '${TransactionConsolidationTypeEnum.REFUND}'
                    AND ${buildNoMovedSourceEntriesSql('expense_tx')}
                    ${operatedAtScopeSql('expense_tx.operated_at')}
            ),
            income_entries AS (
                SELECT
                    income_entry.id as incomeEntryId,
                    income_entry.transaction_id as incomeTransactionId,
                    income_entry.account_id as incomeAccountId,
                    income_entry.amount as incomeEntryAmount,
                    income_entry.exchange_rate as incomeEntryExchangeRate,
                    income_entry.amount * 1.0 / income_entry.exchange_rate as incomeOperationAmount,
                    income_entry.to_iban as incomeEntryToIban,
                    income_tx.title as incomeTransactionTitle,
                    income_tx.operated_at as incomeOperatedAt,
                    income_account.title as incomeAccountTitle,
                    income_account.iban as incomeAccountIban,
                    income_account.sync_zone as incomeAccountSyncZone,
                    income_account.instrument_id as incomeInstrumentId,
                    income_account.external_source as incomeExternalSource,
                    CASE WHEN income_account.external_source = '${ExternalSourceEnum.ENABLE_BANKING}' AND income_account.integration_id IS NOT NULL THEN '${ExternalSourceEnum.ENABLE_BANKING}:' || income_account.integration_id ELSE COALESCE(NULLIF(income_account.external_source, ''), income_tx.external_source) END as incomeBankSource,
                    SUBSTR(income_account.iban, -${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}) as incomeAccountHintSuffix,
                    CASE
                        WHEN income_account.iban IS NOT NULL
                            AND LENGTH(income_account.iban) > ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}
                        THEN SUBSTR(income_account.iban, 1, LENGTH(income_account.iban) - ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH})
                        ELSE NULL
                    END as incomeAccountBankHint,
                    income_instrument.code as incomeCurrency,
                    income_mcc.mcc_group_id as incomeMccGroupId
                FROM transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                INNER JOIN transactions income_tx ON
                    income_entry.transaction_id = income_tx.id
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts income_account ON
                    income_entry.account_id = income_account.id
                    AND income_account.deleted_at IS NULL
                    AND income_account.is_active = 1
                INNER JOIN instruments income_instrument ON income_account.instrument_id = income_instrument.id
                LEFT JOIN mcc_categories income_mcc ON income_entry.mcc_category_id = income_mcc.id
                WHERE income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                    AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND income_entry.amount > 0
                    AND income_entry.exchange_rate > 0
                    AND NOT ${buildPrefixLikeSql('income_tx.title', [...REFUND_TITLE_PREFIXES.rejectedPaymentPrincipal, ...REFUND_TITLE_PREFIXES.rejectedPaymentFee])}
                    AND ${buildNoMovedSourceEntriesSql('income_tx')}
                    ${operatedAtScopeSql('income_tx.operated_at')}
            ),
            ${TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL}
            scored_pairs_base AS (
                SELECT
                    expense_entries.*,
                    income_entries.*,
                    ABS(income_entries.incomeOperatedAt - expense_entries.expenseOperatedAt) as timeDiff,
                    income_entries.incomeEntryAmount * 1.0 / expense_entries.expenseEntryAmount as impliedExchangeRate,
                    aer.rate as expectedExchangeRate,
                    CASE
                        WHEN expense_entries.expenseEntryToIban IS NOT NULL
                            AND expense_entries.expenseEntryToIban != ''
                            AND expense_entries.expenseEntryToIban = income_entries.incomeAccountIban
                        THEN 1
                        WHEN income_entries.incomeEntryToIban IS NOT NULL
                            AND income_entries.incomeEntryToIban != ''
                            AND income_entries.incomeEntryToIban = expense_entries.expenseAccountIban
                        THEN 1
                        ELSE 0
                    END as ibanMatch,
                    CASE
                        WHEN expense_entries.expenseAccountSyncZone != income_entries.incomeAccountSyncZone
                        THEN 1
                        ELSE 0
                    END as isCrossZonePair,
                    CASE
                        WHEN expense_entries.expenseMccGroupId = ${TRANSFER_MCC_GROUP_ID}
                            OR income_entries.incomeMccGroupId = ${TRANSFER_MCC_GROUP_ID}
                        THEN 1
                        ELSE 0
                    END as hasTransferMcc,
                    CASE
                        WHEN expense_entries.expenseInstrumentId = income_entries.incomeInstrumentId
                        THEN 1
                        ELSE 0
                    END as sameCurrency,
                    CASE
                        WHEN expense_entries.expenseBankSource IS NOT NULL
                            AND expense_entries.expenseBankSource != ''
                            AND income_entries.incomeBankSource IS NOT NULL
                            AND income_entries.incomeBankSource != ''
                            AND expense_entries.expenseBankSource = income_entries.incomeBankSource
                            AND expense_entries.expenseBankSource NOT LIKE '${ExternalSourceEnum.ENABLE_BANKING}%'
                        THEN 1
                        WHEN expense_entries.expenseAccountBankHint IS NOT NULL
                            AND expense_entries.expenseAccountBankHint != ''
                            AND expense_entries.expenseAccountBankHint = income_entries.incomeAccountBankHint
                        THEN 1
                        ELSE 0
                    END as sameBank,
                    CASE
                        WHEN expense_entries.expenseBankSource LIKE '${ExternalSourceEnum.ENABLE_BANKING}%'
                            OR income_entries.incomeBankSource LIKE '${ExternalSourceEnum.ENABLE_BANKING}%'
                        THEN 1
                        ELSE 0
                    END as isBookingDayPair,
                    CASE
                        WHEN expense_entries.expenseInstrumentId = income_entries.incomeInstrumentId
                            AND expense_entries.expenseEntryAmount = income_entries.incomeEntryAmount
                        THEN 1
                        ELSE 0
                    END as sameCurrencyAmountMatch,
                    CASE
                        WHEN expense_entries.expenseInstrumentId != income_entries.incomeInstrumentId
                            AND expense_entries.expenseEntryExchangeRate != 1
                            AND income_entries.incomeEntryExchangeRate != 1
                            AND ABS(expense_entries.expenseEntryAmount - income_entries.incomeOperationAmount) / expense_entries.expenseEntryAmount <= 0.01
                            AND ABS(income_entries.incomeEntryAmount - expense_entries.expenseOperationAmount) / income_entries.incomeEntryAmount <= 0.01
                        THEN 1
                        ELSE 0
                    END as operationAmountMatch,
                    CASE
                        WHEN expense_entries.expenseInstrumentId != income_entries.incomeInstrumentId
                            AND (
                                (expense_entries.expenseEntryExchangeRate != 1
                                    AND ABS(expense_entries.expenseOperationAmount - income_entries.incomeEntryAmount) <= ${CANONICAL_CENT_TOLERANCE_AMOUNT})
                                OR (income_entries.incomeEntryExchangeRate != 1
                                    AND ABS(income_entries.incomeOperationAmount - expense_entries.expenseEntryAmount) <= ${CANONICAL_CENT_TOLERANCE_AMOUNT})
                            )
                        THEN 1
                        ELSE 0
                    END as bankRateAmountMatch,
                    CASE
                        WHEN expense_entries.expenseAccountHintSuffix IS NOT NULL
                            AND income_entries.incomeAccountHintSuffix IS NOT NULL
                            AND LENGTH(expense_entries.expenseAccountHintSuffix) = ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}
                            AND LENGTH(income_entries.incomeAccountHintSuffix) = ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}
                            AND expense_entries.expenseTransactionTitle LIKE '%' || income_entries.incomeAccountHintSuffix || '%'
                            AND income_entries.incomeTransactionTitle LIKE '%' || expense_entries.expenseAccountHintSuffix || '%'
                            AND expense_entries.expenseEntryAmount > income_entries.incomeEntryAmount
                            AND expense_entries.expenseEntryAmount - income_entries.incomeEntryAmount <= ${TRANSFER_PAIR_SAME_BANK_HINTED_FEE_MAX_AMOUNT_DELTA}
                            AND (expense_entries.expenseEntryAmount - income_entries.incomeEntryAmount) * 1.0 / income_entries.incomeEntryAmount <= ${TRANSFER_PAIR_SAME_BANK_HINTED_FEE_MAX_AMOUNT_DELTA_RATIO}
                        THEN 1
                        ELSE 0
                    END as hintedFeeAmountMatch,
                    CASE
                        WHEN expense_entries.expenseBankSource IS NOT NULL
                            AND expense_entries.expenseBankSource != ''
                            AND income_entries.incomeBankSource IS NOT NULL
                            AND income_entries.incomeBankSource != ''
                            AND expense_entries.expenseBankSource != income_entries.incomeBankSource
                            AND expense_entries.expenseInstrumentId = income_entries.incomeInstrumentId
                            AND expense_entries.expenseMccGroupId = ${TRANSFER_MCC_GROUP_ID}
                            AND income_entries.incomeMccGroupId = ${TRANSFER_MCC_GROUP_ID}
                            AND expense_entries.expenseEntryAmount > income_entries.incomeEntryAmount
                            AND expense_entries.expenseEntryAmount - income_entries.incomeEntryAmount <= ${TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA}
                            AND (expense_entries.expenseEntryAmount - income_entries.incomeEntryAmount) * 1.0 / income_entries.incomeEntryAmount <= ${TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA_RATIO}
                        THEN 1
                        ELSE 0
                    END as interbankHintedFeeAmountMatch
                FROM expense_entries
                INNER JOIN income_entries ON
                    income_entries.incomeAccountId != expense_entries.expenseAccountId
                    AND income_entries.incomeOperatedAt BETWEEN
                        expense_entries.expenseOperatedAt - ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}
                        AND expense_entries.expenseOperatedAt + ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}
                LEFT JOIN available_exchange_rates aer ON
                    expense_entries.expenseInstrumentId != income_entries.incomeInstrumentId
                    AND aer.base_instrument_id = expense_entries.expenseInstrumentId
                    AND aer.quote_instrument_id = income_entries.incomeInstrumentId
            ),
`;

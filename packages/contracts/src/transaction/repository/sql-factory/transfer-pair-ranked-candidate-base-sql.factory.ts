import { TRANSFER_MCC_GROUP_ID } from '../../constant/transfer-mcc-group-id.constant';
import {
    TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH,
    TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA,
    TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA_RATIO,
    TRANSFER_PAIR_SAME_BANK_HINTED_FEE_MAX_AMOUNT_DELTA,
    TRANSFER_PAIR_SAME_BANK_HINTED_FEE_MAX_AMOUNT_DELTA_RATIO
} from '../../constant/transfer-pair-hinted-fee.constant';
import { TRANSFER_PAIR_TIME_WINDOW_SECONDS } from '../../constant/transfer-pair-time-window.constant';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

export const TRANSFER_PAIR_RANKED_CANDIDATE_BASE_SQL = `
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
                    expense_account.instrument_id as expenseInstrumentId,
                    expense_account.external_source as expenseExternalSource,
                    COALESCE(NULLIF(expense_account.external_source, ''), expense_tx.external_source) as expenseBankSource,
                    SUBSTR(expense_account.iban, -${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}) as expenseAccountHintSuffix,
                    CASE
                        WHEN expense_account.iban IS NOT NULL
                            AND LENGTH(expense_account.iban) > ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}
                        THEN SUBSTR(expense_account.iban, 1, LENGTH(expense_account.iban) - ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH})
                        ELSE NULL
                    END as expenseAccountBankHint,
                    expense_instrument.code as expenseCurrency,
                    expense_mcc.mcc_group_id as expenseMccGroupId
                FROM transaction_entries expense_entry
                INNER JOIN transactions expense_tx ON
                    expense_entry.transaction_id = expense_tx.id
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts expense_account ON
                    expense_entry.account_id = expense_account.id
                    AND expense_account.deleted_at IS NULL
                INNER JOIN instruments expense_instrument ON expense_account.instrument_id = expense_instrument.id
                LEFT JOIN mcc_categories expense_mcc ON expense_entry.mcc_category_id = expense_mcc.id
                WHERE expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.exchange_rate > 0
            ),
            income_entries AS (
                SELECT
                    income_entry.id as incomeEntryId,
                    income_entry.transaction_id as incomeTransactionId,
                    income_entry.account_id as incomeAccountId,
                    income_entry.amount as incomeEntryAmount,
                    income_entry.exchange_rate as incomeEntryExchangeRate,
                    income_entry.amount / income_entry.exchange_rate as incomeOperationAmount,
                    income_entry.to_iban as incomeEntryToIban,
                    income_tx.title as incomeTransactionTitle,
                    income_tx.operated_at as incomeOperatedAt,
                    income_account.title as incomeAccountTitle,
                    income_account.instrument_id as incomeInstrumentId,
                    income_account.external_source as incomeExternalSource,
                    COALESCE(NULLIF(income_account.external_source, ''), income_tx.external_source) as incomeBankSource,
                    SUBSTR(income_account.iban, -${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}) as incomeAccountHintSuffix,
                    CASE
                        WHEN income_account.iban IS NOT NULL
                            AND LENGTH(income_account.iban) > ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}
                        THEN SUBSTR(income_account.iban, 1, LENGTH(income_account.iban) - ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH})
                        ELSE NULL
                    END as incomeAccountBankHint,
                    income_instrument.code as incomeCurrency,
                    income_mcc.mcc_group_id as incomeMccGroupId
                FROM transaction_entries income_entry
                INNER JOIN transactions income_tx ON
                    income_entry.transaction_id = income_tx.id
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts income_account ON
                    income_entry.account_id = income_account.id
                    AND income_account.deleted_at IS NULL
                INNER JOIN instruments income_instrument ON income_account.instrument_id = income_instrument.id
                LEFT JOIN mcc_categories income_mcc ON income_entry.mcc_category_id = income_mcc.id
                WHERE income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
            ),
            latest_exchange_rates AS (
                SELECT
                    base_instrument_id,
                    quote_instrument_id,
                    rate * 1.0 as rate,
                    ROW_NUMBER() OVER (
                        PARTITION BY base_instrument_id, quote_instrument_id
                        ORDER BY created_at DESC
                    ) as exchangeRateRank
                FROM exchange_rates
                WHERE deleted_at IS NULL
                    AND rate > 0
            ),
            available_exchange_rates AS (
                SELECT base_instrument_id, quote_instrument_id, rate
                FROM (
                    SELECT
                        base_instrument_id,
                        quote_instrument_id,
                        rate,
                        ROW_NUMBER() OVER (
                            PARTITION BY base_instrument_id, quote_instrument_id
                            ORDER BY direction
                        ) as directionRank
                    FROM (
                        SELECT
                            base_instrument_id,
                            quote_instrument_id,
                            rate,
                            0 as direction
                        FROM latest_exchange_rates
                        WHERE exchangeRateRank = 1
                        UNION ALL
                        SELECT
                            quote_instrument_id as base_instrument_id,
                            base_instrument_id as quote_instrument_id,
                            1.0 / rate as rate,
                            1 as direction
                        FROM latest_exchange_rates
                        WHERE exchangeRateRank = 1
                    )
                )
                WHERE directionRank = 1
            ),
            scored_pairs_base AS (
                SELECT
                    expense_entries.*,
                    income_entries.*,
                    ABS(income_entries.incomeOperatedAt - expense_entries.expenseOperatedAt) as timeDiff,
                    CASE
                        WHEN expense_entries.expenseEntryAmount > 0
                        THEN income_entries.incomeEntryAmount * 1.0 / expense_entries.expenseEntryAmount
                        ELSE NULL
                    END as impliedExchangeRate,
                    (
                        SELECT rate FROM available_exchange_rates
                        WHERE base_instrument_id = expense_entries.expenseInstrumentId
                            AND quote_instrument_id = income_entries.incomeInstrumentId
                        LIMIT 1
                    ) as expectedExchangeRate,
                    CASE
                        WHEN expense_entries.expenseEntryToIban IS NOT NULL
                            AND expense_entries.expenseEntryToIban != ''
                            AND expense_entries.expenseEntryToIban = (
                                SELECT iban FROM accounts WHERE id = income_entries.incomeAccountId AND deleted_at IS NULL
                            )
                        THEN 1
                        WHEN income_entries.incomeEntryToIban IS NOT NULL
                            AND income_entries.incomeEntryToIban != ''
                            AND income_entries.incomeEntryToIban = (
                                SELECT iban FROM accounts WHERE id = expense_entries.expenseAccountId AND deleted_at IS NULL
                            )
                        THEN 1
                        ELSE 0
                    END as ibanMatch,
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
                        WHEN expense_entries.expenseExternalSource IS NOT NULL
                            AND expense_entries.expenseExternalSource != ''
                            AND expense_entries.expenseExternalSource = income_entries.incomeExternalSource
                        THEN 1
                        WHEN expense_entries.expenseAccountBankHint IS NOT NULL
                            AND expense_entries.expenseAccountBankHint != ''
                            AND expense_entries.expenseAccountBankHint = income_entries.incomeAccountBankHint
                        THEN 1
                        ELSE 0
                    END as sameBank,
                    CASE
                        WHEN expense_entries.expenseInstrumentId = income_entries.incomeInstrumentId
                            AND expense_entries.expenseEntryAmount = income_entries.incomeEntryAmount
                        THEN 1
                        ELSE 0
                    END as sameCurrencyAmountMatch,
                    CASE
                        WHEN expense_entries.expenseInstrumentId != income_entries.incomeInstrumentId
                            AND expense_entries.expenseEntryExchangeRate > 0
                            AND income_entries.incomeEntryExchangeRate > 0
                            AND expense_entries.expenseEntryExchangeRate != 1
                            AND income_entries.incomeEntryExchangeRate != 1
                            AND ABS(expense_entries.expenseEntryAmount - income_entries.incomeOperationAmount) / expense_entries.expenseEntryAmount <= 0.01
                            AND ABS(income_entries.incomeEntryAmount - expense_entries.expenseOperationAmount) / income_entries.incomeEntryAmount <= 0.01
                        THEN 1
                        ELSE 0
                    END as operationAmountMatch,
                    CASE
                        WHEN expense_entries.expenseAccountHintSuffix IS NOT NULL
                            AND income_entries.incomeAccountHintSuffix IS NOT NULL
                            AND LENGTH(expense_entries.expenseAccountHintSuffix) = ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}
                            AND LENGTH(income_entries.incomeAccountHintSuffix) = ${TRANSFER_PAIR_ACCOUNT_HINT_SUFFIX_LENGTH}
                            AND expense_entries.expenseTransactionTitle LIKE '%' || income_entries.incomeAccountHintSuffix || '%'
                            AND income_entries.incomeTransactionTitle LIKE '%' || expense_entries.expenseAccountHintSuffix || '%'
                            AND income_entries.incomeEntryAmount > 0
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
                            AND income_entries.incomeEntryAmount > 0
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
            ),
`;

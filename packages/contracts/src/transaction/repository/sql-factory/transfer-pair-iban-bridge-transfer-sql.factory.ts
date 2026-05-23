import { TRANSFER_MCC_GROUP_ID } from '../../constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../constant/transfer-pair-fast-time-window.constant';
import { TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE } from '../../constant/transfer-pair-implied-rate-tolerance.constant';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

export const IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL = `
            WITH bridge_candidates AS (
                SELECT
                    expense_tx.id as expenseTransactionId,
                    expense_tx.title as expenseTransactionTitle,
                    expense_tx.comment as expenseTransactionComment,
                    expense_tx.operated_at as operatedAt,
                    expense_entry.id as expenseEntryId,
                    expense_entry.to_iban as expenseEntryToIban,
                    income_tx.id as incomeTransactionId,
                    income_tx.title as incomeTransactionTitle,
                    income_entry.id as incomeEntryId,
                    income_entry.to_iban as incomeEntryToIban,
                    bridge_account.id as bridgeAccountId,
                    bridge_account.title as bridgeAccountTitle,
                    expense_entry.amount as bridgeAmount,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle,
                    ROUND(income_entry.amount / income_entry.exchange_rate) as sourceAmount,
                    ABS(income_tx.operated_at - expense_tx.operated_at) as timeDiff
                FROM transaction_entries expense_entry
                INNER JOIN transactions expense_tx ON
                    expense_entry.transaction_id = expense_tx.id
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = expense_entry.account_id
                    AND bridge_account.deleted_at IS NULL
                INNER JOIN transactions income_tx ON
                    income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(income_tx.operated_at - expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries income_entry ON
                    income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.account_id = expense_entry.account_id
                    AND income_entry.amount = expense_entry.amount
                    AND income_entry.exchange_rate > 0
                INNER JOIN accounts source_account ON
                    source_account.iban = income_entry.to_iban
                    AND source_account.deleted_at IS NULL
                INNER JOIN accounts target_account ON
                    target_account.iban = expense_entry.to_iban
                    AND target_account.deleted_at IS NULL
                LEFT JOIN mcc_categories expense_mcc ON expense_mcc.id = expense_entry.mcc_category_id
                LEFT JOIN mcc_categories income_mcc ON income_mcc.id = income_entry.mcc_category_id
                WHERE expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.exchange_rate > 0
                    AND expense_entry.amount > 0
                    AND expense_entry.to_iban IS NOT NULL
                    AND expense_entry.to_iban != ''
                    AND income_entry.to_iban IS NOT NULL
                    AND income_entry.to_iban != ''
                    AND source_account.id != bridge_account.id
                    AND target_account.id != bridge_account.id
                    AND source_account.id != target_account.id
                    AND (
                        expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                    )
            )
            SELECT
                'AUTO_IBAN_BRIDGE_TRANSFER' as confidenceBucket,
                expenseTransactionId,
                expenseTransactionTitle,
                expenseTransactionComment,
                operatedAt,
                expenseEntryId,
                expenseEntryToIban,
                incomeTransactionId,
                incomeTransactionTitle,
                incomeEntryId,
                incomeEntryToIban,
                bridgeAccountId,
                bridgeAccountTitle,
                bridgeAmount,
                sourceAccountId,
                sourceAccountTitle,
                sourceAmount,
                targetAccountId,
                targetAccountTitle,
                sourceAmount * 1.0 / bridgeAmount as exchangeRate,
                (
                    SELECT direct_tx.id
                    FROM transactions direct_tx
                    WHERE direct_tx.type = '${TransactionTypeEnum.TRANSFER}'
                        AND direct_tx.deleted_at IS NULL
                        AND direct_tx.consolidation_parent_transaction_id IS NULL
                        AND direct_tx.from_account_id = bridge_candidates.sourceAccountId
                        AND direct_tx.to_account_id = bridge_candidates.targetAccountId
                        AND ABS(direct_tx.operated_at - bridge_candidates.operatedAt) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND EXISTS (
                            SELECT 1
                            FROM transaction_entries direct_source_entry
                            WHERE direct_source_entry.transaction_id = direct_tx.id
                                AND direct_source_entry.deleted_at IS NULL
                                AND direct_source_entry.original_transaction_id IS NULL
                                AND direct_source_entry.account_id = bridge_candidates.sourceAccountId
                                AND direct_source_entry.amount = bridge_candidates.sourceAmount
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM transaction_entries direct_target_entry
                            WHERE direct_target_entry.transaction_id = direct_tx.id
                                AND direct_target_entry.deleted_at IS NULL
                                AND direct_target_entry.original_transaction_id IS NULL
                                AND direct_target_entry.account_id = bridge_candidates.targetAccountId
                                AND direct_target_entry.amount = bridge_candidates.bridgeAmount
                        )
                    LIMIT 1
                ) as existingDirectTransferId,
                timeDiff
            FROM bridge_candidates
`;

export const LEGACY_DIRECT_BRIDGE_TRANSFER_CANDIDATES_SQL = `
            WITH latest_exchange_rates AS (
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
            direct_bridge_transfers AS MATERIALIZED (
                SELECT
                    direct_tx.id as existingDirectTransferId,
                    direct_tx.operated_at as directOperatedAt,
                    direct_tx.from_account_id as bridgeAccountId,
                    direct_tx.to_account_id as targetAccountId,
                    direct_source_entry.amount as bridgeAmount
                FROM transactions direct_tx
                INNER JOIN transaction_entries direct_source_entry ON
                    direct_source_entry.transaction_id = direct_tx.id
                    AND direct_source_entry.deleted_at IS NULL
                    AND direct_source_entry.original_transaction_id IS NULL
                    AND direct_source_entry.account_id = direct_tx.from_account_id
                WHERE direct_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND direct_tx.deleted_at IS NULL
                    AND direct_tx.consolidation_parent_transaction_id IS NULL
            ),
            bridge_candidates AS (
                SELECT
                    expense_tx.id as expenseTransactionId,
                    expense_tx.title as expenseTransactionTitle,
                    expense_tx.comment as expenseTransactionComment,
                    expense_tx.operated_at as operatedAt,
                    expense_entry.id as expenseEntryId,
                    expense_entry.to_iban as expenseEntryToIban,
                    income_tx.id as incomeTransactionId,
                    income_tx.title as incomeTransactionTitle,
                    income_entry.id as incomeEntryId,
                    income_entry.to_iban as incomeEntryToIban,
                    bridge_account.id as bridgeAccountId,
                    bridge_account.title as bridgeAccountTitle,
                    income_entry.amount as bridgeAmount,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    direct_transfer.targetAccountId,
                    target_account.title as targetAccountTitle,
                    expense_entry.amount as sourceAmount,
                    direct_transfer.existingDirectTransferId,
                    MAX(
                        ABS(income_tx.operated_at - expense_tx.operated_at),
                        ABS(direct_transfer.directOperatedAt - income_tx.operated_at)
                    ) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY expense_tx.id
                        ORDER BY
                            ABS((income_entry.amount * 1.0 / expense_entry.amount) - exchange_rate.rate) / exchange_rate.rate,
                            MAX(
                                ABS(income_tx.operated_at - expense_tx.operated_at),
                                ABS(direct_transfer.directOperatedAt - income_tx.operated_at)
                            ),
                            income_tx.id,
                            direct_transfer.existingDirectTransferId
                    ) as expenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY income_tx.id
                        ORDER BY
                            ABS((income_entry.amount * 1.0 / expense_entry.amount) - exchange_rate.rate) / exchange_rate.rate,
                            MAX(
                                ABS(income_tx.operated_at - expense_tx.operated_at),
                                ABS(direct_transfer.directOperatedAt - income_tx.operated_at)
                            ),
                            expense_tx.id,
                            direct_transfer.existingDirectTransferId
                    ) as incomeRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY direct_transfer.existingDirectTransferId
                        ORDER BY
                            ABS((income_entry.amount * 1.0 / expense_entry.amount) - exchange_rate.rate) / exchange_rate.rate,
                            MAX(
                                ABS(income_tx.operated_at - expense_tx.operated_at),
                                ABS(direct_transfer.directOperatedAt - income_tx.operated_at)
                            ),
                            expense_tx.id,
                            income_tx.id
                    ) as directTransferRank
                FROM transactions income_tx
                INNER JOIN transaction_entries income_entry ON
                    income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.amount > 0
                    AND (income_entry.to_iban IS NULL OR income_entry.to_iban = '')
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = income_entry.account_id
                    AND bridge_account.deleted_at IS NULL
                    AND bridge_account.iban IS NOT NULL
                    AND bridge_account.iban != ''
                INNER JOIN direct_bridge_transfers direct_transfer ON
                    direct_transfer.bridgeAccountId = bridge_account.id
                    AND direct_transfer.bridgeAmount = income_entry.amount
                    AND direct_transfer.directOperatedAt BETWEEN
                        income_tx.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND income_tx.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN accounts target_account ON
                    target_account.id = direct_transfer.targetAccountId
                    AND target_account.deleted_at IS NULL
                    AND target_account.id != bridge_account.id
                INNER JOIN transactions expense_tx ON
                    expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                    AND expense_tx.operated_at BETWEEN
                        income_tx.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND income_tx.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries expense_entry ON
                    expense_entry.transaction_id = expense_tx.id
                    AND expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.amount > 0
                    AND (expense_entry.to_iban IS NULL OR expense_entry.to_iban = '')
                INNER JOIN accounts source_account ON
                    source_account.id = expense_entry.account_id
                    AND source_account.deleted_at IS NULL
                    AND source_account.iban IS NOT NULL
                    AND source_account.iban != ''
                    AND source_account.id != bridge_account.id
                    AND source_account.id != target_account.id
                    AND source_account.instrument_id != bridge_account.instrument_id
                    AND SUBSTR(source_account.iban, 5, 6) = SUBSTR(bridge_account.iban, 5, 6)
                INNER JOIN available_exchange_rates exchange_rate ON
                    exchange_rate.base_instrument_id = source_account.instrument_id
                    AND exchange_rate.quote_instrument_id = bridge_account.instrument_id
                WHERE income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS((income_entry.amount * 1.0 / expense_entry.amount) - exchange_rate.rate) / exchange_rate.rate <= ${TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE}
            )
            SELECT
                'AUTO_IBAN_BRIDGE_TRANSFER' as confidenceBucket,
                expenseTransactionId,
                expenseTransactionTitle,
                expenseTransactionComment,
                operatedAt,
                expenseEntryId,
                expenseEntryToIban,
                incomeTransactionId,
                incomeTransactionTitle,
                incomeEntryId,
                incomeEntryToIban,
                bridgeAccountId,
                bridgeAccountTitle,
                bridgeAmount,
                sourceAccountId,
                sourceAccountTitle,
                sourceAmount,
                targetAccountId,
                targetAccountTitle,
                sourceAmount * 1.0 / bridgeAmount as exchangeRate,
                existingDirectTransferId,
                timeDiff
            FROM bridge_candidates
            WHERE expenseRank = 1
                AND incomeRank = 1
                AND directTransferRank = 1
`;

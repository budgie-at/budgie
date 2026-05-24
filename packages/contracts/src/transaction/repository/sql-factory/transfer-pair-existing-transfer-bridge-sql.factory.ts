import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../constant/transfer-pair-fast-time-window.constant';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

export const EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL = `
            SELECT
                'AUTO_EXISTING_TRANSFER_BRIDGE' as confidenceBucket,
                sourceExpenseTransactionId,
                sourceExpenseTransactionTitle,
                sourceExpenseTransactionComment,
                sourceExpenseEntryId,
                sourceExpenseEntryToIban,
                bridgeIncomeTransactionId,
                bridgeIncomeTransactionTitle,
                bridgeIncomeEntryId,
                existingTransferId,
                existingTransferTitle,
                operatedAt,
                sourceAccountId,
                sourceAccountTitle,
                bridgeAccountId,
                bridgeAccountTitle,
                targetAccountId,
                targetAccountTitle,
                sourceAmount,
                targetAmount,
                sourceAmount * 1.0 / targetAmount as exchangeRate,
                timeDiff
            FROM (
                SELECT
                    source_expense_tx.id as sourceExpenseTransactionId,
                    source_expense_tx.title as sourceExpenseTransactionTitle,
                    source_expense_tx.comment as sourceExpenseTransactionComment,
                    source_expense_entry.id as sourceExpenseEntryId,
                    source_expense_entry.to_iban as sourceExpenseEntryToIban,
                    bridge_income_tx.id as bridgeIncomeTransactionId,
                    bridge_income_tx.title as bridgeIncomeTransactionTitle,
                    bridge_income_entry.id as bridgeIncomeEntryId,
                    existing_transfer.id as existingTransferId,
                    existing_transfer.title as existingTransferTitle,
                    existing_transfer.operated_at as operatedAt,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    bridge_account.id as bridgeAccountId,
                    bridge_account.title as bridgeAccountTitle,
                    target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle,
                    source_expense_entry.amount as sourceAmount,
                    bridge_income_entry.amount as targetAmount,
                    MAX(
                        ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                        ABS(existing_transfer.operated_at - bridge_income_tx.operated_at)
                    ) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY source_expense_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(existing_transfer.operated_at - bridge_income_tx.operated_at)
                            ),
                            bridge_income_tx.id,
                            existing_transfer.id
                    ) as sourceExpenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY bridge_income_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(existing_transfer.operated_at - bridge_income_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            existing_transfer.id
                    ) as bridgeIncomeRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY existing_transfer.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(existing_transfer.operated_at - bridge_income_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            bridge_income_tx.id
                    ) as existingTransferRank
                FROM transactions existing_transfer
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = existing_transfer.from_account_id
                    AND bridge_account.deleted_at IS NULL
                INNER JOIN transaction_entries existing_bridge_entry ON
                    existing_bridge_entry.transaction_id = existing_transfer.id
                    AND existing_bridge_entry.deleted_at IS NULL
                    AND existing_bridge_entry.original_transaction_id IS NULL
                    AND existing_bridge_entry.account_id = bridge_account.id
                INNER JOIN transaction_entries existing_target_entry ON
                    existing_target_entry.transaction_id = existing_transfer.id
                    AND existing_target_entry.deleted_at IS NULL
                    AND existing_target_entry.original_transaction_id IS NULL
                    AND existing_target_entry.account_id = existing_transfer.to_account_id
                    AND existing_target_entry.amount = existing_bridge_entry.amount
                INNER JOIN accounts target_account ON
                    target_account.id = existing_target_entry.account_id
                    AND target_account.deleted_at IS NULL
                    AND target_account.instrument_id = bridge_account.instrument_id
                INNER JOIN transaction_entries bridge_income_entry ON
                    bridge_income_entry.deleted_at IS NULL
                    AND bridge_income_entry.original_transaction_id IS NULL
                    AND bridge_income_entry.account_id = bridge_account.id
                    AND bridge_income_entry.amount = existing_bridge_entry.amount
                    AND bridge_income_entry.exchange_rate > 0
                INNER JOIN transactions bridge_income_tx ON
                    bridge_income_tx.id = bridge_income_entry.transaction_id
                    AND bridge_income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND bridge_income_tx.deleted_at IS NULL
                    AND bridge_income_tx.consolidation_parent_transaction_id IS NULL
                    AND bridge_income_tx.operated_at BETWEEN existing_transfer.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND existing_transfer.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transactions source_expense_tx ON
                    source_expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND source_expense_tx.deleted_at IS NULL
                    AND source_expense_tx.consolidation_parent_transaction_id IS NULL
                    AND source_expense_tx.operated_at BETWEEN bridge_income_tx.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND bridge_income_tx.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries source_expense_entry ON
                    source_expense_entry.transaction_id = source_expense_tx.id
                    AND source_expense_entry.deleted_at IS NULL
                    AND source_expense_entry.original_transaction_id IS NULL
                    AND source_expense_entry.amount > 0
                    AND source_expense_entry.exchange_rate > 0
                INNER JOIN accounts source_account ON
                    source_account.id = source_expense_entry.account_id
                    AND source_account.deleted_at IS NULL
                    AND source_account.instrument_id != bridge_account.instrument_id
                WHERE existing_transfer.type = '${TransactionTypeEnum.TRANSFER}'
                    AND existing_transfer.deleted_at IS NULL
                    AND existing_transfer.consolidation_parent_transaction_id IS NULL
                    AND existing_transfer.consolidation_type IS NULL
                    AND existing_transfer.from_account_id IS NOT NULL
                    AND existing_transfer.to_account_id IS NOT NULL
                    AND source_account.id != bridge_account.id
                    AND bridge_account.id != target_account.id
                    AND source_account.id != target_account.id
            )
            WHERE sourceExpenseRank = 1
                AND bridgeIncomeRank = 1
                AND existingTransferRank = 1
`;

import { TransactionEntryTypeEnum } from '../../../transaction-entry/enum/transaction-entry-type.enum';
import { IBAN_BRIDGE_CHAIN_FX_TOLERANCE } from '../../constant/iban-bridge-chain-fx-tolerance.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../constant/transfer-pair-fast-time-window.constant';
import { TransactionConsolidationTypeEnum } from '../../enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

export const EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL = `
            SELECT
                'AUTO_EXISTING_TRANSFER_CHAIN_RECLAIM' as confidenceBucket,
                existingTransferId,
                existingTransferTitle,
                bridgeIncomeTransactionId,
                bridgeIncomeTransactionTitle,
                bridgeIncomeEntryId,
                bridgeExpenseTransactionId,
                bridgeExpenseTransactionTitle,
                bridgeExpenseEntryId,
                sourceAccountId,
                sourceAccountTitle,
                bridgeAccountId,
                bridgeAccountTitle,
                targetAccountId,
                targetAccountTitle,
                targetAccountIban,
                sourceAmount,
                targetAmount,
                sourceAmount * 1.0 / targetAmount as exchangeRate,
                operatedAt,
                timeDiff
            FROM (
                SELECT
                    existing_transfer.id as existingTransferId,
                    existing_transfer.title as existingTransferTitle,
                    bridge_income_tx.id as bridgeIncomeTransactionId,
                    bridge_income_tx.title as bridgeIncomeTransactionTitle,
                    bridge_income_entry.id as bridgeIncomeEntryId,
                    bridge_expense_tx.id as bridgeExpenseTransactionId,
                    bridge_expense_tx.title as bridgeExpenseTransactionTitle,
                    bridge_expense_entry.id as bridgeExpenseEntryId,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    bridge_account.id as bridgeAccountId,
                    bridge_account.title as bridgeAccountTitle,
                    target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle,
                    target_account.iban as targetAccountIban,
                    existing_source_entry.amount as sourceAmount,
                    existing_target_entry.amount as targetAmount,
                    existing_transfer.operated_at as operatedAt,
                    MAX(
                        ABS(bridge_income_tx.operated_at - existing_transfer.operated_at),
                        ABS(bridge_expense_tx.operated_at - existing_transfer.operated_at)
                    ) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY existing_transfer.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - existing_transfer.operated_at),
                                ABS(bridge_expense_tx.operated_at - existing_transfer.operated_at)
                            ),
                            bridge_income_tx.id,
                            bridge_expense_tx.id
                    ) as existingTransferRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY bridge_income_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - existing_transfer.operated_at),
                                ABS(bridge_expense_tx.operated_at - existing_transfer.operated_at)
                            ),
                            existing_transfer.id,
                            bridge_expense_tx.id
                    ) as bridgeIncomeRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY bridge_expense_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - existing_transfer.operated_at),
                                ABS(bridge_expense_tx.operated_at - existing_transfer.operated_at)
                            ),
                            existing_transfer.id,
                            bridge_income_tx.id
                    ) as bridgeExpenseRank
                FROM transactions existing_transfer
                INNER JOIN transaction_entries existing_source_entry ON
                    existing_source_entry.transaction_id = existing_transfer.id
                    AND existing_source_entry.deleted_at IS NULL
                    AND existing_source_entry.original_transaction_id IS NULL
                    AND existing_source_entry.account_id = existing_transfer.from_account_id
                INNER JOIN accounts source_account ON
                    source_account.id = existing_source_entry.account_id
                    AND source_account.deleted_at IS NULL
                    AND source_account.is_active = 1
                    AND source_account.iban IS NOT NULL
                    AND source_account.iban != ''
                INNER JOIN transaction_entries existing_target_entry ON
                    existing_target_entry.transaction_id = existing_transfer.id
                    AND existing_target_entry.deleted_at IS NULL
                    AND existing_target_entry.original_transaction_id IS NULL
                    AND existing_target_entry.account_id = existing_transfer.to_account_id
                INNER JOIN accounts target_account ON
                    target_account.id = existing_target_entry.account_id
                    AND target_account.deleted_at IS NULL
                    AND target_account.is_active = 1
                    AND target_account.iban IS NOT NULL
                    AND target_account.iban != ''
                INNER JOIN transaction_entries bridge_income_entry ON
                    bridge_income_entry.deleted_at IS NULL
                    AND bridge_income_entry.original_transaction_id IS NULL
                    AND bridge_income_entry.amount = existing_target_entry.amount
                    AND bridge_income_entry.exchange_rate > 0
                    AND bridge_income_entry.to_iban = source_account.iban
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = bridge_income_entry.account_id
                    AND bridge_account.deleted_at IS NULL
                    AND bridge_account.is_active = 1
                    AND bridge_account.instrument_id = target_account.instrument_id
                INNER JOIN transactions bridge_income_tx ON
                    bridge_income_tx.id = bridge_income_entry.transaction_id
                    AND bridge_income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND bridge_income_tx.deleted_at IS NULL
                    AND bridge_income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(bridge_income_tx.operated_at - existing_transfer.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries bridge_expense_entry ON
                    bridge_expense_entry.deleted_at IS NULL
                    AND bridge_expense_entry.original_transaction_id IS NULL
                    AND bridge_expense_entry.account_id = bridge_account.id
                    AND bridge_expense_entry.amount = existing_target_entry.amount
                    AND bridge_expense_entry.exchange_rate > 0
                    AND bridge_expense_entry.to_iban = target_account.iban
                INNER JOIN transactions bridge_expense_tx ON
                    bridge_expense_tx.id = bridge_expense_entry.transaction_id
                    AND bridge_expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND bridge_expense_tx.deleted_at IS NULL
                    AND bridge_expense_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(bridge_expense_tx.operated_at - existing_transfer.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                WHERE existing_transfer.type = '${TransactionTypeEnum.TRANSFER}'
                    AND existing_transfer.deleted_at IS NULL
                    AND existing_transfer.consolidation_parent_transaction_id IS NULL
                    AND existing_transfer.from_account_id IS NOT NULL
                    AND existing_transfer.to_account_id IS NOT NULL
                    AND existing_transfer.consolidation_type = '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}'
                    AND source_account.id != bridge_account.id
                    AND bridge_account.id != target_account.id
                    AND source_account.id != target_account.id
                    AND ABS(existing_source_entry.amount - (bridge_income_entry.amount / bridge_income_entry.exchange_rate)) / existing_source_entry.amount <= ${IBAN_BRIDGE_CHAIN_FX_TOLERANCE}
                    AND NOT EXISTS (
                        SELECT 1
                        FROM transaction_entries bridge_income_fee_entry
                        WHERE bridge_income_fee_entry.transaction_id = bridge_income_tx.id
                            AND bridge_income_fee_entry.deleted_at IS NULL
                            AND bridge_income_fee_entry.original_transaction_id IS NULL
                            AND bridge_income_fee_entry.type = '${TransactionEntryTypeEnum.FEE}'
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM transaction_entries bridge_expense_fee_entry
                        WHERE bridge_expense_fee_entry.transaction_id = bridge_expense_tx.id
                            AND bridge_expense_fee_entry.deleted_at IS NULL
                            AND bridge_expense_fee_entry.original_transaction_id IS NULL
                            AND bridge_expense_fee_entry.type = '${TransactionEntryTypeEnum.FEE}'
                    )
            )
            WHERE existingTransferRank = 1
                AND bridgeIncomeRank = 1
                AND bridgeExpenseRank = 1
`;

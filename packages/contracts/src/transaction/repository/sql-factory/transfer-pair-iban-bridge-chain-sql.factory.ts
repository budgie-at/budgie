import { TRANSFER_MCC_GROUP_ID } from '../../constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../constant/transfer-pair-fast-time-window.constant';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

export const IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL = `
            SELECT
                'AUTO_IBAN_BRIDGE_CHAIN_TRANSFER' as confidenceBucket,
                sourceExpenseTransactionId,
                sourceExpenseTransactionTitle,
                sourceExpenseTransactionComment,
                sourceExpenseEntryId,
                sourceExpenseEntryToIban,
                bridgeIncomeTransactionId,
                bridgeIncomeTransactionTitle,
                bridgeIncomeEntryId,
                bridgeExpenseTransactionId,
                bridgeExpenseTransactionTitle,
                bridgeExpenseEntryId,
                targetIncomeTransactionId,
                targetIncomeTransactionTitle,
                targetIncomeEntryId,
                operatedAt,
                sourceAccountId,
                sourceAccountTitle,
                bridgeAccountId,
                bridgeAccountTitle,
                targetAccountId,
                targetAccountTitle,
                sourceAmount,
                bridgeAmount,
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
                    bridge_expense_tx.id as bridgeExpenseTransactionId,
                    bridge_expense_tx.title as bridgeExpenseTransactionTitle,
                    bridge_expense_entry.id as bridgeExpenseEntryId,
                    target_income_tx.id as targetIncomeTransactionId,
                    target_income_tx.title as targetIncomeTransactionTitle,
                    target_income_entry.id as targetIncomeEntryId,
                    source_expense_tx.operated_at as operatedAt,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    bridge_account.id as bridgeAccountId,
                    bridge_account.title as bridgeAccountTitle,
                    target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle,
                    source_expense_entry.amount as sourceAmount,
                    bridge_income_entry.amount as bridgeAmount,
                    target_income_entry.amount as targetAmount,
                    MAX(
                        ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                        ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                        ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                    ) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY source_expense_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                                ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                            ),
                            bridge_income_tx.id,
                            bridge_expense_tx.id,
                            target_income_tx.id
                    ) as sourceExpenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY bridge_income_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                                ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            bridge_expense_tx.id,
                            target_income_tx.id
                    ) as bridgeIncomeRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY bridge_expense_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                                ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            bridge_income_tx.id,
                            target_income_tx.id
                    ) as bridgeExpenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY target_income_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                                ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            bridge_income_tx.id,
                            bridge_expense_tx.id
                    ) as targetIncomeRank
                FROM transaction_entries source_expense_entry
                INNER JOIN transactions source_expense_tx ON
                    source_expense_entry.transaction_id = source_expense_tx.id
                    AND source_expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND source_expense_tx.deleted_at IS NULL
                    AND source_expense_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts source_account ON
                    source_account.id = source_expense_entry.account_id
                    AND source_account.deleted_at IS NULL
                    AND source_account.iban IS NOT NULL
                    AND source_account.iban != ''
                INNER JOIN transactions bridge_income_tx ON
                    bridge_income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND bridge_income_tx.deleted_at IS NULL
                    AND bridge_income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries bridge_income_entry ON
                    bridge_income_entry.transaction_id = bridge_income_tx.id
                    AND bridge_income_entry.deleted_at IS NULL
                    AND bridge_income_entry.original_transaction_id IS NULL
                    AND bridge_income_entry.exchange_rate > 0
                    AND bridge_income_entry.amount > 0
                    AND bridge_income_entry.to_iban = source_account.iban
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = bridge_income_entry.account_id
                    AND bridge_account.deleted_at IS NULL
                INNER JOIN transactions bridge_expense_tx ON
                    bridge_expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND bridge_expense_tx.deleted_at IS NULL
                    AND bridge_expense_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries bridge_expense_entry ON
                    bridge_expense_entry.transaction_id = bridge_expense_tx.id
                    AND bridge_expense_entry.deleted_at IS NULL
                    AND bridge_expense_entry.original_transaction_id IS NULL
                    AND bridge_expense_entry.account_id = bridge_account.id
                    AND bridge_expense_entry.amount = bridge_income_entry.amount
                    AND bridge_expense_entry.exchange_rate > 0
                    AND bridge_expense_entry.to_iban IS NOT NULL
                    AND bridge_expense_entry.to_iban != ''
                INNER JOIN transactions target_income_tx ON
                    target_income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND target_income_tx.deleted_at IS NULL
                    AND target_income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(target_income_tx.operated_at - source_expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries target_income_entry ON
                    target_income_entry.transaction_id = target_income_tx.id
                    AND target_income_entry.deleted_at IS NULL
                    AND target_income_entry.original_transaction_id IS NULL
                    AND target_income_entry.amount = bridge_expense_entry.amount
                    AND target_income_entry.exchange_rate > 0
                INNER JOIN accounts target_account ON
                    target_account.id = target_income_entry.account_id
                    AND target_account.deleted_at IS NULL
                    AND target_account.iban = bridge_expense_entry.to_iban
                    AND target_account.iban = source_expense_entry.to_iban
                LEFT JOIN mcc_categories source_expense_mcc ON source_expense_mcc.id = source_expense_entry.mcc_category_id
                LEFT JOIN mcc_categories bridge_income_mcc ON bridge_income_mcc.id = bridge_income_entry.mcc_category_id
                LEFT JOIN mcc_categories bridge_expense_mcc ON bridge_expense_mcc.id = bridge_expense_entry.mcc_category_id
                LEFT JOIN mcc_categories target_income_mcc ON target_income_mcc.id = target_income_entry.mcc_category_id
                WHERE source_expense_entry.deleted_at IS NULL
                    AND source_expense_entry.original_transaction_id IS NULL
                    AND source_expense_entry.exchange_rate > 0
                    AND source_expense_entry.amount > 0
                    AND source_expense_entry.to_iban IS NOT NULL
                    AND source_expense_entry.to_iban != ''
                    AND source_account.id != bridge_account.id
                    AND bridge_account.id != target_account.id
                    AND source_account.id != target_account.id
                    AND ABS(source_expense_entry.amount - (bridge_income_entry.amount / bridge_income_entry.exchange_rate)) / source_expense_entry.amount <= 0.01
                    AND (
                        source_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR bridge_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR bridge_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR target_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                    )
                    AND (source_expense_mcc.mcc_group_id IS NULL OR source_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (bridge_income_mcc.mcc_group_id IS NULL OR bridge_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (bridge_expense_mcc.mcc_group_id IS NULL OR bridge_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (target_income_mcc.mcc_group_id IS NULL OR target_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
            )
            WHERE sourceExpenseRank = 1
                AND bridgeIncomeRank = 1
                AND bridgeExpenseRank = 1
                AND targetIncomeRank = 1
`;

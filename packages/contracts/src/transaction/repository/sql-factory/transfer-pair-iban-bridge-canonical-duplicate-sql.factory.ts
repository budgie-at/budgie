import { TRANSFER_MCC_GROUP_ID } from '../../constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../constant/transfer-pair-fast-time-window.constant';
import { TransactionConsolidationTypeEnum } from '../../enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

export const IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL = `
            SELECT
                'AUTO_IBAN_BRIDGE_CANONICAL_DUPLICATE' as confidenceBucket,
                expenseTransactionId,
                incomeTransactionId,
                existingCanonicalTransferId,
                sourceAccountId,
                targetAccountId,
                timeDiff
            FROM (
                SELECT
                    source_expense_tx.id as expenseTransactionId,
                    target_income_tx.id as incomeTransactionId,
                    canonical_tx.id as existingCanonicalTransferId,
                    source_account.id as sourceAccountId,
                    target_account.id as targetAccountId,
                    ABS(target_income_tx.operated_at - source_expense_tx.operated_at) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY source_expense_tx.id
                        ORDER BY
                            ABS(target_income_tx.operated_at - source_expense_tx.operated_at),
                            ABS(canonical_tx.operated_at - source_expense_tx.operated_at),
                            canonical_tx.id,
                            target_income_tx.id
                    ) as expenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY target_income_tx.id
                        ORDER BY
                            ABS(target_income_tx.operated_at - source_expense_tx.operated_at),
                            ABS(canonical_tx.operated_at - source_expense_tx.operated_at),
                            canonical_tx.id,
                            source_expense_tx.id
                    ) as incomeRank
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
                INNER JOIN accounts target_account ON
                    target_account.iban = source_expense_entry.to_iban
                    AND target_account.deleted_at IS NULL
                    AND target_account.id != source_account.id
                INNER JOIN transactions target_income_tx ON
                    target_income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND target_income_tx.deleted_at IS NULL
                    AND target_income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(target_income_tx.operated_at - source_expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries target_income_entry ON
                    target_income_entry.transaction_id = target_income_tx.id
                    AND target_income_entry.deleted_at IS NULL
                    AND target_income_entry.original_transaction_id IS NULL
                    AND target_income_entry.account_id = target_account.id
                    AND target_income_entry.amount > 0
                    AND target_income_entry.exchange_rate > 0
                INNER JOIN transactions canonical_tx ON
                    canonical_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND canonical_tx.deleted_at IS NULL
                    AND canonical_tx.consolidation_parent_transaction_id IS NULL
                    AND canonical_tx.consolidation_type IN ('${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}', '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER}')
                    AND canonical_tx.from_account_id = source_account.id
                    AND canonical_tx.to_account_id = target_account.id
                    AND ABS(canonical_tx.operated_at - source_expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                LEFT JOIN mcc_categories source_expense_mcc ON source_expense_mcc.id = source_expense_entry.mcc_category_id
                LEFT JOIN mcc_categories target_income_mcc ON target_income_mcc.id = target_income_entry.mcc_category_id
                WHERE source_expense_entry.deleted_at IS NULL
                    AND source_expense_entry.original_transaction_id IS NULL
                    AND source_expense_entry.exchange_rate > 0
                    AND source_expense_entry.amount > 0
                    AND source_expense_entry.to_iban IS NOT NULL
                    AND source_expense_entry.to_iban != ''
                    AND (
                        source_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR target_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                    )
                    AND (source_expense_mcc.mcc_group_id IS NULL OR source_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (target_income_mcc.mcc_group_id IS NULL OR target_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND EXISTS (
                        SELECT 1
                        FROM transaction_entries canonical_source_entry
                        WHERE canonical_source_entry.transaction_id = canonical_tx.id
                            AND canonical_source_entry.deleted_at IS NULL
                            AND canonical_source_entry.original_transaction_id IS NULL
                            AND canonical_source_entry.account_id = source_account.id
                            AND canonical_source_entry.amount = source_expense_entry.amount
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM transaction_entries canonical_target_entry
                        WHERE canonical_target_entry.transaction_id = canonical_tx.id
                            AND canonical_target_entry.deleted_at IS NULL
                            AND canonical_target_entry.original_transaction_id IS NULL
                            AND canonical_target_entry.account_id = target_account.id
                            AND canonical_target_entry.amount = target_income_entry.amount
                    )
            )
            WHERE expenseRank = 1
                AND incomeRank = 1
`;

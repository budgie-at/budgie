import { TRANSFER_MCC_GROUP_ID } from '../../constant/transfer-mcc-group-id.constant';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

const EXISTING_TRANSFER_DUPLICATE_TIME_WINDOW_SECONDS = 2 * 60 * 60;

export const EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL = `
            SELECT
                'AUTO_EXISTING_TRANSFER_INCOME_DUPLICATE' as confidenceBucket,
                existingTransferId,
                existingTransferTitle,
                incomeTransactionId,
                incomeTransactionTitle,
                sourceAccountId,
                sourceAccountTitle,
                targetAccountId,
                targetAccountTitle,
                amount,
                timeDiff
            FROM (
                SELECT
                    existing_transfer.id as existingTransferId,
                    existing_transfer.title as existingTransferTitle,
                    income_tx.id as incomeTransactionId,
                    income_tx.title as incomeTransactionTitle,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle,
                    target_entry.amount as amount,
                    ABS(income_tx.operated_at - existing_transfer.operated_at) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY existing_transfer.id
                        ORDER BY
                            ABS(income_tx.operated_at - existing_transfer.operated_at),
                            income_tx.id
                    ) as existingTransferRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY income_tx.id
                        ORDER BY
                            ABS(income_tx.operated_at - existing_transfer.operated_at),
                            existing_transfer.id
                    ) as incomeRank
                FROM transactions existing_transfer INDEXED BY transactions_visible_type_to_operated_idx
                INNER JOIN transaction_entries source_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx ON
                    source_entry.transaction_id = existing_transfer.id
                    AND source_entry.deleted_at IS NULL
                    AND source_entry.original_transaction_id IS NULL
                    AND source_entry.account_id = existing_transfer.from_account_id
                INNER JOIN accounts source_account ON
                    source_account.id = source_entry.account_id
                    AND source_account.deleted_at IS NULL
                INNER JOIN transaction_entries target_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx ON
                    target_entry.transaction_id = existing_transfer.id
                    AND target_entry.deleted_at IS NULL
                    AND target_entry.original_transaction_id IS NULL
                    AND target_entry.account_id = existing_transfer.to_account_id
                INNER JOIN accounts target_account ON
                    target_account.id = target_entry.account_id
                    AND target_account.deleted_at IS NULL
                CROSS JOIN transactions income_tx INDEXED BY transactions_visible_type_operated_idx
                    ON income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.operated_at BETWEEN existing_transfer.operated_at - ${EXISTING_TRANSFER_DUPLICATE_TIME_WINDOW_SECONDS}
                        AND existing_transfer.operated_at + ${EXISTING_TRANSFER_DUPLICATE_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx ON
                    income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.account_id = target_account.id
                    AND income_entry.amount = target_entry.amount
                LEFT JOIN mcc_categories income_mcc ON income_mcc.id = income_entry.mcc_category_id
                WHERE existing_transfer.type = '${TransactionTypeEnum.TRANSFER}'
                    AND existing_transfer.deleted_at IS NULL
                    AND existing_transfer.consolidation_parent_transaction_id IS NULL
                    AND existing_transfer.from_account_id IS NOT NULL
                    AND existing_transfer.to_account_id IS NOT NULL
                    AND source_account.id != target_account.id
                    AND income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
            )
            WHERE existingTransferRank = 1
                AND incomeRank = 1
`;

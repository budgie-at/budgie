import { ExternalSourceEnum } from '../../../account/enum/external-source.enum';
import { TRANSFER_MCC_GROUP_ID } from '../../constant/transfer-mcc-group-id.constant';
import { TransactionConsolidationTypeEnum } from '../../enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

const EXISTING_TRANSFER_DUPLICATE_TIME_WINDOW_SECONDS = 2 * 60 * 60;
const APPROXIMATE_TARGET_AMOUNT_MAX_DELTA = 100_000_000;
const APPROXIMATE_TARGET_AMOUNT_MAX_DELTA_RATIO = 0.005;

export const EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL = `
            WITH candidate_rows AS (
                SELECT
                    'AUTO_EXISTING_TRANSFER_INCOME_DUPLICATE' as confidenceBucket,
                    existing_transfer.id as existingTransferId,
                    existing_transfer.title as existingTransferTitle,
                    income_tx.id as incomeTransactionId,
                    income_tx.title as incomeTransactionTitle,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle,
                    target_entry.id as existingTransferTargetEntryId,
                    source_entry.amount as sourceAmount,
                    target_entry.amount as existingTransferTargetAmount,
                    income_entry.amount as amount,
                    CASE
                        WHEN source_account.instrument_id != target_account.instrument_id THEN source_entry.amount * 1.0 / income_entry.amount
                        ELSE 1
                    END as exchangeRate,
                    0 as amountDelta,
                    ABS(income_tx.operated_at - existing_transfer.operated_at) as timeDiff
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
                    AND (
                        existing_transfer.consolidation_type IS NULL
                        OR existing_transfer.consolidation_type = '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}'
                    )
                    AND existing_transfer.from_account_id IS NOT NULL
                    AND existing_transfer.to_account_id IS NOT NULL
                    AND source_account.id != target_account.id
                    AND income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                UNION ALL
                SELECT
                    'AUTO_EXISTING_TRANSFER_APPROXIMATE_INCOME_DUPLICATE' as confidenceBucket,
                    existing_transfer.id as existingTransferId,
                    existing_transfer.title as existingTransferTitle,
                    income_tx.id as incomeTransactionId,
                    income_tx.title as incomeTransactionTitle,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    income_account.id as targetAccountId,
                    income_account.title as targetAccountTitle,
                    target_entry.id as existingTransferTargetEntryId,
                    source_entry.amount as sourceAmount,
                    target_entry.amount as existingTransferTargetAmount,
                    income_entry.amount as amount,
                    source_entry.amount * 1.0 / income_entry.amount as exchangeRate,
                    ABS(income_entry.amount - target_entry.amount) as amountDelta,
                    ABS(income_tx.operated_at - existing_transfer.operated_at) as timeDiff
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
                    AND target_account.external_source IS NULL
                    AND target_account.iban IS NULL
                CROSS JOIN transactions income_tx INDEXED BY transactions_visible_type_operated_idx
                    ON income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.external_source = '${ExternalSourceEnum.PRIVATBANK}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.operated_at BETWEEN existing_transfer.operated_at - ${EXISTING_TRANSFER_DUPLICATE_TIME_WINDOW_SECONDS}
                        AND existing_transfer.operated_at + ${EXISTING_TRANSFER_DUPLICATE_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx ON
                    income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.amount > 0
                    AND ABS(income_entry.amount - target_entry.amount) <= ${APPROXIMATE_TARGET_AMOUNT_MAX_DELTA}
                    AND ABS(income_entry.amount - ROUND(source_entry.amount / existing_transfer.exchange_rate)) <= ${APPROXIMATE_TARGET_AMOUNT_MAX_DELTA}
                    AND ABS(income_entry.amount - target_entry.amount) <= income_entry.amount * ${APPROXIMATE_TARGET_AMOUNT_MAX_DELTA_RATIO}
                    AND ABS(income_entry.amount - ROUND(source_entry.amount / existing_transfer.exchange_rate)) <= income_entry.amount * ${APPROXIMATE_TARGET_AMOUNT_MAX_DELTA_RATIO}
                INNER JOIN accounts income_account ON
                    income_account.id = income_entry.account_id
                    AND income_account.deleted_at IS NULL
                    AND income_account.external_source = '${ExternalSourceEnum.PRIVATBANK}'
                    AND income_account.instrument_id = target_account.instrument_id
                LEFT JOIN mcc_categories income_mcc ON income_mcc.id = income_entry.mcc_category_id
                WHERE existing_transfer.type = '${TransactionTypeEnum.TRANSFER}'
                    AND existing_transfer.external_source = '${ExternalSourceEnum.MONOBANK}'
                    AND existing_transfer.deleted_at IS NULL
                    AND existing_transfer.consolidation_parent_transaction_id IS NULL
                    AND (
                        existing_transfer.consolidation_type IS NULL
                        OR existing_transfer.consolidation_type = '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}'
                    )
                    AND existing_transfer.from_account_id IS NOT NULL
                    AND existing_transfer.to_account_id IS NOT NULL
                    AND existing_transfer.exchange_rate > 0
                    AND source_account.id != target_account.id
                    AND source_account.instrument_id != income_account.instrument_id
                    AND income_account.id != target_account.id
                    AND income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
            ), ranked_candidates AS (
                SELECT
                    *,
                    ROW_NUMBER() OVER (
                        PARTITION BY existingTransferId
                        ORDER BY
                            amountDelta,
                            timeDiff,
                            incomeTransactionId
                    ) as existingTransferRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY incomeTransactionId
                        ORDER BY
                            amountDelta,
                            timeDiff,
                            existingTransferId
                    ) as incomeRank
                FROM candidate_rows
            )
            SELECT
                confidenceBucket,
                existingTransferId,
                existingTransferTitle,
                incomeTransactionId,
                incomeTransactionTitle,
                sourceAccountId,
                sourceAccountTitle,
                targetAccountId,
                targetAccountTitle,
                existingTransferTargetEntryId,
                sourceAmount,
                existingTransferTargetAmount,
                amount,
                exchangeRate,
                amountDelta,
                timeDiff
            FROM ranked_candidates
            WHERE existingTransferRank = 1
                AND incomeRank = 1
`;

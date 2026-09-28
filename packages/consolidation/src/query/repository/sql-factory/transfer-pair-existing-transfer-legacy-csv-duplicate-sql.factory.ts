import {
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { TRANSFER_MCC_GROUP_ID } from '../../../shared/constant/transfer-mcc-group-id.constant';
import {
    TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA,
    TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA_RATIO
} from '../../../shared/constant/transfer-pair-hinted-fee.constant';

const LEGACY_CSV_DUPLICATE_TIME_WINDOW_SECONDS = 2 * 60 * 60 + 5 * 60;

const LEGACY_CSV_EXISTING_TRANSFER_LEGS_SQL = `FROM transactions existing_transfer INDEXED BY transactions_visible_type_to_operated_idx
                INNER JOIN transaction_entries source_entry ON
                    source_entry.transaction_id = existing_transfer.id AND source_entry.original_transaction_id IS NULL AND source_entry.account_id = existing_transfer.from_account_id
                INNER JOIN accounts source_account ON source_account.id = source_entry.account_id
                INNER JOIN transaction_entries target_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx ON
                    target_entry.transaction_id = existing_transfer.id AND target_entry.deleted_at IS NULL
                    AND target_entry.original_transaction_id IS NULL AND target_entry.account_id = existing_transfer.to_account_id
                INNER JOIN accounts target_account ON target_account.id = target_entry.account_id AND target_account.deleted_at IS NULL`;

const LEGACY_CSV_EXISTING_TRANSFER_CONDITIONS_SQL = `existing_transfer.type = '${TransactionTypeEnum.TRANSFER}' AND existing_transfer.external_source = '${ExternalSourceEnum.CSV}' AND existing_transfer.deleted_at IS NULL
                    AND existing_transfer.consolidation_parent_transaction_id IS NULL
                    AND (existing_transfer.consolidation_type IS NULL OR existing_transfer.consolidation_type = '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}')
                    AND existing_transfer.from_account_id IS NOT NULL AND existing_transfer.to_account_id IS NOT NULL
                    AND (source_entry.deleted_at IS NOT NULL OR source_account.deleted_at IS NOT NULL OR source_account.is_active = 0)
                    AND source_account.id != target_account.id`;

const LEGACY_CSV_EXPENSE_COMPARABLE_AMOUNT_SQL = `CASE expense_account.instrument_id
                    WHEN source_account.instrument_id THEN source_entry.amount
                    WHEN target_account.instrument_id THEN target_entry.amount
                END`;

export const EXISTING_TRANSFER_LEGACY_CSV_DUPLICATE_CANDIDATES_SQL = `SELECT 'AUTO_EXISTING_TRANSFER_CSV_INACTIVE_TARGET_INCOME_DUPLICATE' as confidenceBucket, existing_transfer.id as existingTransferId,
                    existing_transfer.title as existingTransferTitle, income_tx.id as duplicateTransactionId, income_tx.title as duplicateTransactionTitle,
                    source_account.id as sourceAccountId, source_account.title as sourceAccountTitle, income_account.id as targetAccountId,
                    income_account.title as targetAccountTitle, target_entry.id as existingTransferTargetEntryId, source_entry.amount as sourceAmount,
                    target_entry.amount as existingTransferTargetAmount, income_entry.amount as amount,
                    CASE WHEN source_account.instrument_id != income_account.instrument_id THEN source_entry.amount * 1.0 / income_entry.amount ELSE 1 END as exchangeRate,
                    0 as amountDelta, ABS(income_tx.operated_at - existing_transfer.operated_at) as timeDiff
                ${LEGACY_CSV_EXISTING_TRANSFER_LEGS_SQL} AND target_account.is_active = 0
                CROSS JOIN transactions income_tx INDEXED BY transactions_visible_type_operated_idx
                    ON income_tx.type = '${TransactionTypeEnum.INCOME}' AND income_tx.external_source = '${ExternalSourceEnum.PRIVATBANK}' AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.operated_at BETWEEN existing_transfer.operated_at - ${LEGACY_CSV_DUPLICATE_TIME_WINDOW_SECONDS}
                        AND existing_transfer.operated_at + ${LEGACY_CSV_DUPLICATE_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx ON
                    income_entry.transaction_id = income_tx.id AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL AND income_entry.amount = target_entry.amount
                INNER JOIN accounts income_account ON
                    income_account.id = income_entry.account_id AND income_account.deleted_at IS NULL
                    AND income_account.type = '${AccountTypeEnum.BANK_SYNC}' AND income_account.is_active = 1
                    AND income_account.instrument_id = target_account.instrument_id
                LEFT JOIN mcc_categories income_mcc ON income_mcc.id = income_entry.mcc_category_id
                WHERE ${LEGACY_CSV_EXISTING_TRANSFER_CONDITIONS_SQL}
                    AND income_account.id != target_account.id AND income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                UNION ALL
                SELECT 'AUTO_EXISTING_TRANSFER_CSV_INACTIVE_SOURCE_EXPENSE_DUPLICATE' as confidenceBucket, existing_transfer.id as existingTransferId,
                    existing_transfer.title as existingTransferTitle, expense_tx.id as duplicateTransactionId, expense_tx.title as duplicateTransactionTitle,
                    expense_account.id as sourceAccountId, expense_account.title as sourceAccountTitle, target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle, target_entry.id as existingTransferTargetEntryId, expense_entry.amount as sourceAmount,
                    target_entry.amount as existingTransferTargetAmount, target_entry.amount as amount,
                    CASE WHEN expense_account.instrument_id != target_account.instrument_id THEN expense_entry.amount * 1.0 / target_entry.amount ELSE 1 END as exchangeRate,
                    ABS(expense_entry.amount - ${LEGACY_CSV_EXPENSE_COMPARABLE_AMOUNT_SQL}) as amountDelta,
                    ABS(expense_tx.operated_at - existing_transfer.operated_at) as timeDiff
                ${LEGACY_CSV_EXISTING_TRANSFER_LEGS_SQL}
                CROSS JOIN transactions expense_tx INDEXED BY transactions_visible_type_operated_idx
                    ON expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.external_source IN ('${ExternalSourceEnum.MONOBANK}', '${ExternalSourceEnum.PRIVATBANK}') AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                    AND expense_tx.operated_at BETWEEN existing_transfer.operated_at - ${LEGACY_CSV_DUPLICATE_TIME_WINDOW_SECONDS}
                        AND existing_transfer.operated_at + ${LEGACY_CSV_DUPLICATE_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries expense_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx ON
                    expense_entry.transaction_id = expense_tx.id AND expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                INNER JOIN accounts expense_account ON
                    expense_account.id = expense_entry.account_id AND expense_account.deleted_at IS NULL
                    AND expense_account.type = '${AccountTypeEnum.BANK_SYNC}' AND expense_account.is_active = 1
                INNER JOIN mcc_categories expense_mcc ON
                    expense_mcc.id = expense_entry.mcc_category_id AND expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                WHERE ${LEGACY_CSV_EXISTING_TRANSFER_CONDITIONS_SQL}
                    AND expense_account.id != target_account.id
                    AND ABS(expense_entry.amount - ${LEGACY_CSV_EXPENSE_COMPARABLE_AMOUNT_SQL}) <= ${TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA}
                    AND ABS(expense_entry.amount - ${LEGACY_CSV_EXPENSE_COMPARABLE_AMOUNT_SQL})
                        <= ${LEGACY_CSV_EXPENSE_COMPARABLE_AMOUNT_SQL} * ${TRANSFER_PAIR_INTERBANK_HINTED_FEE_MAX_AMOUNT_DELTA_RATIO}`;

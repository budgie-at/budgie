import { TransactionTypeEnum } from '@budgie/contracts';

import { CANONICAL_CENT_TOLERANCE_AMOUNT } from '../../../shared/constant/canonical-cent-tolerance.constant';
import { IBAN_BRIDGE_CHAIN_FX_TOLERANCE } from '../../../shared/constant/iban-bridge-chain-fx-tolerance.constant';
import { TRANSFER_MCC_GROUP_ID } from '../../../shared/constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../../shared/constant/transfer-pair-fast-time-window.constant';
import { operatedAtScopeSql } from '../../utils/operated-at-scope-sql.util';
import { scopedSql } from '../../utils/scoped-sql.util';

export const IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL = scopedSql`
            WITH bridge_candidates AS (
                SELECT
                    expense_tx.id as expenseTransactionId,
                    expense_tx.title as expenseTransactionTitle,
                    expense_tx.operated_at as operatedAt,
                    expense_entry.to_iban as expenseEntryToIban,
                    income_tx.id as incomeTransactionId,
                    income_tx.title as incomeTransactionTitle,
                    bridge_account.id as bridgeAccountId,
                    expense_entry.amount as bridgeAmount,
                    source_account.id as sourceAccountId,
                    target_account.id as targetAccountId,
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
                    AND bridge_account.is_active = 1
                INNER JOIN transactions income_tx ON
                    income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.operated_at BETWEEN expense_tx.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND expense_tx.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    ${operatedAtScopeSql('income_tx.operated_at')}
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
                    AND source_account.is_active = 1
                INNER JOIN accounts target_account ON
                    target_account.iban = expense_entry.to_iban
                    AND target_account.deleted_at IS NULL
                    AND target_account.is_active = 1
                LEFT JOIN mcc_categories expense_mcc ON expense_mcc.id = expense_entry.mcc_category_id
                LEFT JOIN mcc_categories income_mcc ON income_mcc.id = income_entry.mcc_category_id
                WHERE expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.exchange_rate > 0
                    AND expense_entry.amount > 0
                    ${operatedAtScopeSql('expense_tx.operated_at')}
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
                operatedAt,
                expenseEntryToIban,
                incomeTransactionId,
                incomeTransactionTitle,
                bridgeAccountId,
                bridgeAmount,
                sourceAccountId,
                sourceAmount,
                targetAccountId,
                sourceAmount * 1.0 / bridgeAmount as exchangeRate,
                timeDiff
            FROM bridge_candidates
            WHERE NOT EXISTS (
                SELECT 1
                FROM transactions direct_tx
                WHERE direct_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND direct_tx.deleted_at IS NULL
                    AND direct_tx.consolidation_parent_transaction_id IS NULL
                    AND direct_tx.from_account_id = bridge_candidates.sourceAccountId
                    AND direct_tx.to_account_id = bridge_candidates.targetAccountId
                    AND direct_tx.operated_at BETWEEN bridge_candidates.operatedAt - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND bridge_candidates.operatedAt + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    ${operatedAtScopeSql('direct_tx.operated_at')}
                    AND EXISTS (
                        SELECT 1
                        FROM transaction_entries direct_source_entry
                        WHERE direct_source_entry.transaction_id = direct_tx.id
                            AND direct_source_entry.deleted_at IS NULL
                            AND direct_source_entry.original_transaction_id IS NULL
                            AND direct_source_entry.account_id = bridge_candidates.sourceAccountId
                            AND direct_source_entry.amount > 0
                            AND ABS(direct_source_entry.amount - bridge_candidates.sourceAmount) / direct_source_entry.amount <= ${IBAN_BRIDGE_CHAIN_FX_TOLERANCE}
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
            )
            AND NOT EXISTS (
                SELECT 1
                FROM transactions existing_canonical_tx
                WHERE existing_canonical_tx.type = '${TransactionTypeEnum.TRANSFER}'
                    AND existing_canonical_tx.deleted_at IS NULL
                    AND existing_canonical_tx.consolidation_parent_transaction_id IS NULL
                    AND existing_canonical_tx.consolidation_type IS NOT NULL
                    AND existing_canonical_tx.from_account_id = bridge_candidates.sourceAccountId
                    AND existing_canonical_tx.to_account_id = bridge_candidates.targetAccountId
                    AND existing_canonical_tx.operated_at BETWEEN bridge_candidates.operatedAt - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND bridge_candidates.operatedAt + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    ${operatedAtScopeSql('existing_canonical_tx.operated_at')}
                    AND EXISTS (
                        SELECT 1
                        FROM transaction_entries existing_canonical_target_entry
                        WHERE existing_canonical_target_entry.transaction_id = existing_canonical_tx.id
                            AND existing_canonical_target_entry.deleted_at IS NULL
                            AND existing_canonical_target_entry.original_transaction_id IS NULL
                            AND existing_canonical_target_entry.account_id = bridge_candidates.targetAccountId
                            AND existing_canonical_target_entry.amount = bridge_candidates.bridgeAmount
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM transaction_entries existing_canonical_source_entry
                        WHERE existing_canonical_source_entry.transaction_id = existing_canonical_tx.id
                            AND existing_canonical_source_entry.deleted_at IS NULL
                            AND existing_canonical_source_entry.original_transaction_id IS NULL
                            AND existing_canonical_source_entry.account_id = bridge_candidates.sourceAccountId
                            AND ABS(existing_canonical_source_entry.amount - bridge_candidates.sourceAmount) <= ${CANONICAL_CENT_TOLERANCE_AMOUNT}
                    )
            )
`;

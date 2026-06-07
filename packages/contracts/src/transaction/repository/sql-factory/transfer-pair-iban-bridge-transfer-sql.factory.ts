import { TRANSFER_MCC_GROUP_ID } from '../../constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../constant/transfer-pair-fast-time-window.constant';
import { TransactionTypeEnum } from '../../enum/transaction-type.enum';
import { applyConsolidationScanScopeSql } from '../../util/apply-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '../../interface/consolidation-scan-scope.interface';

const INCOME_SCOPE_SQL_PLACEHOLDER = '__IBAN_BRIDGE_TRANSFER_INCOME_SCOPE_SQL__';
const EXPENSE_SCOPE_SQL_PLACEHOLDER = '__IBAN_BRIDGE_TRANSFER_EXPENSE_SCOPE_SQL__';
const DIRECT_TRANSFER_SCOPE_SQL_PLACEHOLDER = '__IBAN_BRIDGE_TRANSFER_DIRECT_SCOPE_SQL__';

const IBAN_BRIDGE_TRANSFER_SCOPE_EXPRESSIONS = new Map([
    [INCOME_SCOPE_SQL_PLACEHOLDER, 'income_tx.operated_at'],
    [EXPENSE_SCOPE_SQL_PLACEHOLDER, 'expense_tx.operated_at'],
    [DIRECT_TRANSFER_SCOPE_SQL_PLACEHOLDER, 'direct_tx.operated_at']
]);

const IBAN_BRIDGE_TRANSFER_CANDIDATES_BASE_SQL = `
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
                    AND bridge_account.is_active = 1
                INNER JOIN transactions income_tx ON
                    income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND income_tx.operated_at BETWEEN expense_tx.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND expense_tx.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    ${INCOME_SCOPE_SQL_PLACEHOLDER}
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
                    ${EXPENSE_SCOPE_SQL_PLACEHOLDER}
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
                        AND direct_tx.operated_at BETWEEN bridge_candidates.operatedAt - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                            AND bridge_candidates.operatedAt + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        ${DIRECT_TRANSFER_SCOPE_SQL_PLACEHOLDER}
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
                    ${DIRECT_TRANSFER_SCOPE_SQL_PLACEHOLDER}
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
            )
`;

export const IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL = (scope: ConsolidationScanScopeInterface | null): string =>
    applyConsolidationScanScopeSql(IBAN_BRIDGE_TRANSFER_CANDIDATES_BASE_SQL, scope, IBAN_BRIDGE_TRANSFER_SCOPE_EXPRESSIONS);

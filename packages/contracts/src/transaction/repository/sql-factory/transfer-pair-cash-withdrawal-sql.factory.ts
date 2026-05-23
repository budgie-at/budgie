import { TransactionTypeEnum } from '../../enum/transaction-type.enum';

export const buildAtmCashWithdrawalCandidatesSql = (): string => `
            WITH active_cash_accounts AS (
                SELECT
                    cash_account.id,
                    cash_account.title,
                    cash_account.instrument_id
                FROM accounts cash_account
                WHERE cash_account.deleted_at IS NULL
                    AND cash_account.is_active = 1
                    AND cash_account.type = 'CASH'
            ),
            cash_account_counts AS (
                SELECT
                    instrument_id,
                    COUNT(*) as cashAccountCount
                FROM active_cash_accounts
                GROUP BY instrument_id
            )
            SELECT
                'AUTO_ATM_CASH_WITHDRAWAL' as confidenceBucket,
                expense_tx.id as transactionId,
                expense_tx.title as transactionTitle,
                expense_tx.comment as transactionComment,
                expense_tx.operated_at as operatedAt,
                expense_entry.id as entryId,
                source_account.id as sourceAccountId,
                source_account.title as sourceAccountTitle,
                target_cash_account.id as targetCashAccountId,
                target_cash_account.title as targetCashAccountTitle,
                source_instrument.code as currency,
                expense_entry.amount as amount
            FROM transaction_entries expense_entry
            INNER JOIN transactions expense_tx ON
                expense_entry.transaction_id = expense_tx.id
                AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                AND expense_tx.deleted_at IS NULL
                AND expense_tx.consolidation_parent_transaction_id IS NULL
            INNER JOIN accounts source_account ON
                source_account.id = expense_entry.account_id
                AND source_account.deleted_at IS NULL
                AND source_account.type != 'CASH'
            INNER JOIN instruments source_instrument ON source_instrument.id = source_account.instrument_id
            INNER JOIN mcc_categories expense_mcc ON
                expense_mcc.id = expense_entry.mcc_category_id
                AND expense_mcc.mcc = '6011'
            INNER JOIN cash_account_counts ON
                cash_account_counts.instrument_id = source_account.instrument_id
                AND cash_account_counts.cashAccountCount = 1
            INNER JOIN active_cash_accounts target_cash_account ON
                target_cash_account.instrument_id = source_account.instrument_id
            WHERE expense_entry.deleted_at IS NULL
                AND expense_entry.original_transaction_id IS NULL
        `;

export const buildAtmCashWithdrawalReviewCandidatesSql = (): string => `
            WITH active_cash_accounts AS (
                SELECT
                    cash_account.id,
                    cash_account.instrument_id
                FROM accounts cash_account
                WHERE cash_account.deleted_at IS NULL
                    AND cash_account.is_active = 1
                    AND cash_account.type = 'CASH'
            ),
            cash_account_counts AS (
                SELECT
                    instrument_id,
                    COUNT(*) as cashAccountCount,
                    GROUP_CONCAT(id) as cashAccountIds
                FROM active_cash_accounts
                GROUP BY instrument_id
            )
            SELECT
                'REVIEW_ATM_CASH_WITHDRAWAL' as confidenceBucket,
                expense_tx.id as transactionId,
                expense_tx.title as transactionTitle,
                source_account.id as sourceAccountId,
                source_account.title as sourceAccountTitle,
                source_instrument.code as currency,
                expense_entry.amount as amount,
                COALESCE(cash_account_counts.cashAccountCount, 0) as cashAccountCount,
                cash_account_counts.cashAccountIds as cashAccountIds
            FROM transaction_entries expense_entry
            INNER JOIN transactions expense_tx ON
                expense_entry.transaction_id = expense_tx.id
                AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                AND expense_tx.deleted_at IS NULL
                AND expense_tx.consolidation_parent_transaction_id IS NULL
            INNER JOIN accounts source_account ON
                source_account.id = expense_entry.account_id
                AND source_account.deleted_at IS NULL
                AND source_account.type != 'CASH'
            INNER JOIN instruments source_instrument ON source_instrument.id = source_account.instrument_id
            INNER JOIN mcc_categories expense_mcc ON
                expense_mcc.id = expense_entry.mcc_category_id
                AND expense_mcc.mcc = '6011'
            LEFT JOIN cash_account_counts ON cash_account_counts.instrument_id = source_account.instrument_id
            WHERE expense_entry.deleted_at IS NULL
                AND expense_entry.original_transaction_id IS NULL
                AND COALESCE(cash_account_counts.cashAccountCount, 0) != 1
        `;

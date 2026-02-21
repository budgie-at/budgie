import { DB } from '../../@generic/type/db.type';
import { TRANSFER_MCC_GROUP_ID } from '../constant/transfer-mcc-group-id.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransferPairCandidateInterface } from '../interface/transfer-pair-candidate.interface';

export class TransferPairRepository {
    constructor(private db: DB) {}

    // eslint-disable-next-line max-lines-per-function
    async findCandidates(): Promise<TransferPairCandidateInterface[]> {
        const sql = `
            WITH forward_matched AS (
                -- Forward matching: expense.to_iban -> income account IBAN
                SELECT
                    expense_entry.id as expense_entry_id,
                    expense_entry.transaction_id as expense_transaction_id,
                    expense_entry.account_id as expense_account_id,
                    expense_entry.amount as expense_entry_amount,
                    expense_entry.exchange_rate as expense_entry_exchange_rate,
                    expense_entry.to_iban as expense_entry_to_iban,
                    income_entry.id as income_entry_id,
                    income_entry.transaction_id as income_transaction_id,
                    income_entry.account_id as income_account_id,
                    income_entry.amount as income_entry_amount,
                    income_entry.exchange_rate as income_entry_exchange_rate,
                    income_entry.to_iban as income_entry_to_iban,
                    'forward' as match_type
                FROM transaction_entries expense_entry
                INNER JOIN mcc_categories expense_mcc ON
                    expense_entry.mcc_category_id = expense_mcc.id
                    AND expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                INNER JOIN accounts income_account ON
                    expense_entry.to_iban IS NOT NULL
                    AND income_account.iban IS NOT NULL
                    AND expense_entry.to_iban = income_account.iban
                INNER JOIN transaction_entries income_entry ON
                    income_entry.account_id = income_account.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.id != expense_entry.id
                INNER JOIN mcc_categories income_mcc ON
                    income_entry.mcc_category_id = income_mcc.id
                    AND income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                WHERE expense_entry.deleted_at IS NULL
                    AND expense_entry.account_id != income_account.id
            ),
            reverse_matched AS (
                -- Reverse matching: income.to_iban -> expense account IBAN
                -- Used for cross-currency FOP transfers where expense.to_iban points to final destination
                SELECT
                    expense_entry.id as expense_entry_id,
                    expense_entry.transaction_id as expense_transaction_id,
                    expense_entry.account_id as expense_account_id,
                    expense_entry.amount as expense_entry_amount,
                    expense_entry.exchange_rate as expense_entry_exchange_rate,
                    expense_entry.to_iban as expense_entry_to_iban,
                    income_entry.id as income_entry_id,
                    income_entry.transaction_id as income_transaction_id,
                    income_entry.account_id as income_account_id,
                    income_entry.amount as income_entry_amount,
                    income_entry.exchange_rate as income_entry_exchange_rate,
                    income_entry.to_iban as income_entry_to_iban,
                    'reverse' as match_type
                FROM transaction_entries income_entry
                INNER JOIN mcc_categories income_mcc ON
                    income_entry.mcc_category_id = income_mcc.id
                    AND income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                INNER JOIN accounts expense_account ON
                    income_entry.to_iban IS NOT NULL
                    AND expense_account.iban IS NOT NULL
                    AND income_entry.to_iban = expense_account.iban
                INNER JOIN transaction_entries expense_entry ON
                    expense_entry.account_id = expense_account.id
                    AND expense_entry.deleted_at IS NULL
                    AND expense_entry.id != income_entry.id
                INNER JOIN mcc_categories expense_mcc ON
                    expense_entry.mcc_category_id = expense_mcc.id
                    AND expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                WHERE income_entry.deleted_at IS NULL
                    AND income_entry.account_id != expense_account.id
            ),
            iban_matched_entries AS (
                -- Combine forward and reverse matches, prefer forward matches
                SELECT * FROM forward_matched
                UNION
                SELECT * FROM reverse_matched
                WHERE NOT EXISTS (
                    SELECT 1 FROM forward_matched fm
                    WHERE fm.expense_entry_id = reverse_matched.expense_entry_id
                    AND fm.income_entry_id = reverse_matched.income_entry_id
                )
            ),
            amount_based_matched AS (
                -- Fallback: same-currency exact amount match when no IBAN available
                -- Used for Private account transfers where counterIban is not provided
                SELECT
                    expense_entry.id as expense_entry_id,
                    expense_entry.transaction_id as expense_transaction_id,
                    expense_entry.account_id as expense_account_id,
                    expense_entry.amount as expense_entry_amount,
                    expense_entry.exchange_rate as expense_entry_exchange_rate,
                    expense_entry.to_iban as expense_entry_to_iban,
                    income_entry.id as income_entry_id,
                    income_entry.transaction_id as income_transaction_id,
                    income_entry.account_id as income_account_id,
                    income_entry.amount as income_entry_amount,
                    income_entry.exchange_rate as income_entry_exchange_rate,
                    income_entry.to_iban as income_entry_to_iban,
                    'amount' as match_type
                FROM transaction_entries expense_entry
                INNER JOIN mcc_categories expense_mcc ON
                    expense_entry.mcc_category_id = expense_mcc.id
                    AND expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                INNER JOIN accounts expense_account ON
                    expense_entry.account_id = expense_account.id
                INNER JOIN transaction_entries income_entry ON
                    income_entry.amount = expense_entry.amount
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.id != expense_entry.id
                    AND income_entry.account_id != expense_entry.account_id
                INNER JOIN mcc_categories income_mcc ON
                    income_entry.mcc_category_id = income_mcc.id
                    AND income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                INNER JOIN accounts income_account ON
                    income_entry.account_id = income_account.id
                    AND income_account.instrument_id = expense_account.instrument_id
                WHERE expense_entry.deleted_at IS NULL
                    AND (expense_entry.to_iban IS NULL OR expense_entry.to_iban = '')
                    AND NOT EXISTS (
                        SELECT 1 FROM iban_matched_entries ime
                        WHERE ime.expense_entry_id = expense_entry.id
                    )
            ),
            all_matched_entries AS (
                SELECT * FROM iban_matched_entries
                UNION
                SELECT * FROM amount_based_matched
            ),
            transaction_filtered AS (
                SELECT
                    ame.*,
                    expense_tx.title as expense_transaction_title,
                    expense_tx.comment as expense_transaction_comment,
                    expense_tx.operated_at as expense_operated_at,
                    income_tx.title as income_transaction_title,
                    income_tx.operated_at as income_operated_at
                FROM all_matched_entries ame
                INNER JOIN transactions expense_tx ON
                    ame.expense_transaction_id = expense_tx.id
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                INNER JOIN transactions income_tx ON
                    ame.income_transaction_id = income_tx.id
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
            ),
            amount_matched AS (
                SELECT
                    tf.*,
                    expense_account.instrument_id as expense_instrument_id,
                    income_account.instrument_id as income_instrument_id,
                    ABS(CAST(tf.income_operated_at AS INTEGER) - CAST(tf.expense_operated_at AS INTEGER)) as time_diff
                FROM transaction_filtered tf
                INNER JOIN accounts expense_account ON tf.expense_account_id = expense_account.id
                INNER JOIN accounts income_account ON tf.income_account_id = income_account.id
                WHERE
                    -- Time constraint: within 12 hours (43200 seconds)
                    ABS(CAST(tf.income_operated_at AS INTEGER) - CAST(tf.expense_operated_at AS INTEGER)) <= 43200
                    AND (
                        -- Same currency: exact amount match
                        (expense_account.instrument_id = income_account.instrument_id
                         AND tf.expense_entry_amount = tf.income_entry_amount)
                        OR
                        -- Different currency: within 5% after exchange rate conversion (divide by rate to get base currency)
                        (expense_account.instrument_id != income_account.instrument_id
                         AND ABS(tf.expense_entry_amount / tf.expense_entry_exchange_rate - tf.income_entry_amount / tf.income_entry_exchange_rate) < (tf.expense_entry_amount / tf.expense_entry_exchange_rate * 0.05))
                    )
            ),
            ranked_pairs AS (
                SELECT
                    am.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY am.expense_transaction_id
                        ORDER BY am.time_diff
                    ) as expense_rank,
                    ROW_NUMBER() OVER (
                        PARTITION BY am.income_transaction_id
                        ORDER BY am.time_diff
                    ) as income_rank
                FROM amount_matched am
            )
            SELECT
                expense_transaction_id,
                expense_transaction_title,
                expense_transaction_comment,
                expense_entry_id,
                expense_account_id as expense_entry_account_id,
                expense_entry_amount,
                expense_entry_exchange_rate,
                expense_entry_to_iban,
                income_transaction_id,
                income_transaction_title,
                income_entry_id,
                income_account_id as income_entry_account_id,
                income_entry_amount,
                income_entry_exchange_rate,
                income_entry_to_iban,
                match_type
            FROM ranked_pairs
            WHERE expense_rank = 1 AND income_rank = 1
        `;

        return this.db.all<TransferPairCandidateInterface>(sql as never);
    }
}

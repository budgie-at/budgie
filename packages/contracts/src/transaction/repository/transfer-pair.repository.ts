import { DB } from '../../@generic/type/db.type';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransferPairCandidateInterface } from '../interface/transfer-pair-candidate.interface';

export class TransferPairRepository {
    constructor(private db: DB) {}

    // eslint-disable-next-line max-lines-per-function
    async findCandidates(): Promise<TransferPairCandidateInterface[]> {
        const sql = `
            WITH iban_matched_entries AS (
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
                    income_entry.to_iban as income_entry_to_iban
                FROM transaction_entries expense_entry
                INNER JOIN mcc_categories expense_mcc ON
                    expense_entry.mcc_category_id = expense_mcc.id
                    AND expense_mcc.mcc_group_id = 10
                INNER JOIN accounts income_account ON
                    expense_entry.to_iban IS NOT NULL
                    AND income_account.iban IS NOT NULL
                    AND expense_entry.to_iban = income_account.iban
                INNER JOIN transaction_entries income_entry ON
                    income_entry.account_id = income_account.id
                    AND income_entry.deleted_at IS NULL
                INNER JOIN mcc_categories income_mcc ON
                    income_entry.mcc_category_id = income_mcc.id
                    AND income_mcc.mcc_group_id = 10
                WHERE expense_entry.deleted_at IS NULL
                    AND expense_entry.account_id != income_account.id
            ),
            transaction_filtered AS (
                SELECT
                    ime.expense_entry_id,
                    ime.expense_transaction_id,
                    ime.expense_account_id,
                    ime.expense_entry_amount,
                    ime.expense_entry_exchange_rate,
                    ime.expense_entry_to_iban,
                    ime.income_entry_id,
                    ime.income_transaction_id,
                    ime.income_account_id,
                    ime.income_entry_amount,
                    ime.income_entry_exchange_rate,
                    ime.income_entry_to_iban,
                    expense_tx.title as expense_transaction_title,
                    expense_tx.comment as expense_transaction_comment,
                    expense_tx.operated_at as expense_operated_at,
                    income_tx.title as income_transaction_title,
                    income_tx.operated_at as income_operated_at
                FROM iban_matched_entries ime
                INNER JOIN transactions expense_tx ON
                    ime.expense_transaction_id = expense_tx.id
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                INNER JOIN transactions income_tx ON
                    ime.income_transaction_id = income_tx.id
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
            ),
            amount_matched AS (
                SELECT
                    tf.*,
                    expense_account.instrument_id as expense_instrument_id,
                    income_account.instrument_id as income_instrument_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY tf.expense_transaction_id
                        ORDER BY ABS(CAST(tf.income_operated_at AS INTEGER) - CAST(tf.expense_operated_at AS INTEGER))
                    ) as expense_rn,
                    ROW_NUMBER() OVER (
                        PARTITION BY tf.income_transaction_id
                        ORDER BY ABS(CAST(tf.income_operated_at AS INTEGER) - CAST(tf.expense_operated_at AS INTEGER))
                    ) as income_rn
                FROM transaction_filtered tf
                INNER JOIN accounts expense_account ON tf.expense_account_id = expense_account.id
                INNER JOIN accounts income_account ON tf.income_account_id = income_account.id
                WHERE (
                    (expense_account.instrument_id = income_account.instrument_id
                     AND tf.expense_entry_amount = tf.income_entry_amount)
                    OR
                    (expense_account.instrument_id != income_account.instrument_id
                     AND ABS(tf.expense_entry_amount * tf.expense_entry_exchange_rate - tf.income_entry_amount * tf.income_entry_exchange_rate) < (tf.expense_entry_amount * tf.expense_entry_exchange_rate * 0.05))
                )
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
                income_entry_to_iban
            FROM amount_matched
            WHERE expense_rn = 1 AND income_rn = 1
        `;

        return this.db.all<TransferPairCandidateInterface>(sql as never);
    }
}

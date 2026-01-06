import { DB } from '../../@generic/type/db.type';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransferPairCandidateInterface } from '../interface/transfer-pair-candidate.interface';

export class TransferPairRepository {
    constructor(private db: DB) {}

    async findCandidates(): Promise<TransferPairCandidateInterface[]> {
        const sql = `
            WITH all_pairs AS (
                SELECT
                    expense_tx.id as expense_transaction_id,
                    expense_tx.title as expense_transaction_title,
                    expense_tx.comment as expense_transaction_comment,
                    expense_entry.id as expense_entry_id,
                    expense_entry.account_id as expense_entry_account_id,
                    expense_entry.amount as expense_entry_amount,
                    expense_entry.exchange_rate as expense_entry_exchange_rate,
                    expense_entry.to_iban as expense_entry_to_iban,
                    income_tx.id as income_transaction_id,
                    income_tx.title as income_transaction_title,
                    income_entry.id as income_entry_id,
                    income_entry.account_id as income_entry_account_id,
                    income_entry.amount as income_entry_amount,
                    income_entry.exchange_rate as income_entry_exchange_rate,
                    income_entry.to_iban as income_entry_to_iban,
                    ROW_NUMBER() OVER (PARTITION BY expense_tx.id ORDER BY ABS(CAST(income_tx.operated_at AS INTEGER) - CAST(expense_tx.operated_at AS INTEGER))) as expense_rn,
                    ROW_NUMBER() OVER (PARTITION BY income_tx.id ORDER BY ABS(CAST(income_tx.operated_at AS INTEGER) - CAST(expense_tx.operated_at AS INTEGER))) as income_rn
                FROM transactions expense_tx
                INNER JOIN transaction_entries expense_entry ON expense_tx.id = expense_entry.transaction_id
                INNER JOIN accounts expense_account ON expense_entry.account_id = expense_account.id
                INNER JOIN mcc_categories expense_mcc ON
                    expense_entry.mcc_category_id = expense_mcc.id
                    AND expense_mcc.mcc_group_id = 10
                INNER JOIN transactions income_tx ON
                    income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                INNER JOIN transaction_entries income_entry ON
                    income_tx.id = income_entry.transaction_id
                    AND income_entry.deleted_at IS NULL
                INNER JOIN accounts income_account ON income_entry.account_id = income_account.id
                INNER JOIN mcc_categories income_mcc ON
                    income_entry.mcc_category_id = income_mcc.id
                    AND income_mcc.mcc_group_id = 10
                WHERE expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_entry.deleted_at IS NULL
                    AND expense_account.id != income_account.id
                    AND (
                        (expense_entry.to_iban IS NOT NULL
                         AND income_account.iban IS NOT NULL
                         AND expense_entry.to_iban = income_account.iban)
                        OR
                        (income_entry.to_iban IS NOT NULL
                         AND expense_account.iban IS NOT NULL
                         AND income_entry.to_iban = expense_account.iban)
                    )
                    AND (
                        (expense_account.instrument_id = income_account.instrument_id
                         AND expense_entry.amount = income_entry.amount)
                        OR
                        (expense_account.instrument_id != income_account.instrument_id
                         AND ABS(expense_entry.amount * expense_entry.exchange_rate - income_entry.amount * income_entry.exchange_rate) < (expense_entry.amount * expense_entry.exchange_rate * 0.05))
                    )
            )
            SELECT
                expense_transaction_id,
                expense_transaction_title,
                expense_transaction_comment,
                expense_entry_id,
                expense_entry_account_id,
                expense_entry_amount,
                expense_entry_exchange_rate,
                expense_entry_to_iban,
                income_transaction_id,
                income_transaction_title,
                income_entry_id,
                income_entry_account_id,
                income_entry_amount,
                income_entry_exchange_rate,
                income_entry_to_iban
            FROM all_pairs
            WHERE expense_rn = 1 AND income_rn = 1
        `;

        return this.db.all<TransferPairCandidateInterface>(sql as never);
    }
}

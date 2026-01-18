import { DB } from '../../@generic/type/db.type';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransitiveEntryCandidateInterface } from '../interface/transitive-entry-candidate.interface';

export class TransitiveEntryRepository {
    constructor(private db: DB) {}

    async findCandidates(): Promise<TransitiveEntryCandidateInterface[]> {
        const sql = this.buildTransitiveEntriesQuery();

        return this.db.all<TransitiveEntryCandidateInterface>(sql as never);
    }

    private buildTransitiveEntriesQuery(): string {
        return `
            WITH transfer_entries_data AS (
                SELECT
                    te.id as entry_id, te.transaction_id, te.account_id, te.amount, te.to_iban,
                    te.exchange_rate, a.iban as account_iban, a.instrument_id, t.operated_at,
                    t.from_account_id, t.to_account_id
                FROM transaction_entries te
                INNER JOIN transactions t ON te.transaction_id = t.id
                    AND t.type = '${TransactionTypeEnum.TRANSFER}' AND t.deleted_at IS NULL
                INNER JOIN accounts a ON te.account_id = a.id
                WHERE te.deleted_at IS NULL
            ),
            transfer_expense_entries AS (
                SELECT * FROM transfer_entries_data WHERE account_id = from_account_id
            ),
            transfer_income_entries AS (
                SELECT * FROM transfer_entries_data WHERE account_id = to_account_id
            ),
            orphan_income_candidates AS (
                SELECT te.id as orphan_income_entry_id, te.transaction_id as orphan_income_transaction_id,
                    te.account_id as orphan_income_account_id, te.amount as orphan_income_amount,
                    te.exchange_rate as orphan_income_exchange_rate,
                    a.iban as orphan_income_iban, a.instrument_id as orphan_income_instrument_id,
                    t.operated_at as orphan_income_operated_at
                FROM transaction_entries te
                INNER JOIN transactions t ON te.transaction_id = t.id
                    AND t.type = '${TransactionTypeEnum.INCOME}' AND t.deleted_at IS NULL
                INNER JOIN accounts a ON te.account_id = a.id
                INNER JOIN mcc_categories mcc ON te.mcc_category_id = mcc.id AND mcc.mcc_group_id = 10
                WHERE te.deleted_at IS NULL
            ),
            orphan_expense_candidates AS (
                SELECT te.id as orphan_expense_entry_id, te.transaction_id as orphan_expense_transaction_id,
                    te.account_id as orphan_expense_account_id, te.amount as orphan_expense_amount,
                    te.to_iban as orphan_expense_to_iban, a.iban as orphan_expense_iban,
                    a.instrument_id as orphan_expense_instrument_id, t.operated_at as orphan_expense_operated_at
                FROM transaction_entries te
                INNER JOIN transactions t ON te.transaction_id = t.id
                    AND t.type = '${TransactionTypeEnum.EXPENSE}' AND t.deleted_at IS NULL
                INNER JOIN accounts a ON te.account_id = a.id
                INNER JOIN mcc_categories mcc ON te.mcc_category_id = mcc.id AND mcc.mcc_group_id = 10
                WHERE te.deleted_at IS NULL
            ),
            transitive_matches AS (
                SELECT tee.transaction_id as transfer_transaction_id,
                    oic.orphan_income_entry_id as transitive_income_entry_id,
                    oic.orphan_income_transaction_id as transitive_income_transaction_id,
                    oec.orphan_expense_entry_id as transitive_expense_entry_id,
                    oec.orphan_expense_transaction_id as transitive_expense_transaction_id,
                    oic.orphan_income_account_id as intermediate_account_id,
                    ABS(CAST(oic.orphan_income_operated_at AS INTEGER) - CAST(tee.operated_at AS INTEGER)) as income_time_diff,
                    ABS(CAST(oec.orphan_expense_operated_at AS INTEGER) - CAST(tee.operated_at AS INTEGER)) as expense_time_diff
                FROM transfer_expense_entries tee
                INNER JOIN transfer_income_entries tie ON tie.transaction_id = tee.transaction_id
                INNER JOIN orphan_income_candidates oic ON oic.orphan_income_account_id != tee.account_id
                    AND oic.orphan_income_account_id != tie.account_id
                    AND ABS(CAST(oic.orphan_income_operated_at AS INTEGER) - CAST(tee.operated_at AS INTEGER)) <= 300
                    AND (
                        (tee.instrument_id = oic.orphan_income_instrument_id AND ABS(tee.amount) = oic.orphan_income_amount)
                        OR (tee.instrument_id != oic.orphan_income_instrument_id
                            AND ABS(ABS(tee.amount) / tee.exchange_rate - oic.orphan_income_amount / oic.orphan_income_exchange_rate)
                                < (ABS(tee.amount) / tee.exchange_rate * 0.05))
                    )
                INNER JOIN orphan_expense_candidates oec ON oec.orphan_expense_account_id = oic.orphan_income_account_id
                    AND oec.orphan_expense_amount = oic.orphan_income_amount
                    AND ABS(CAST(oec.orphan_expense_operated_at AS INTEGER) - CAST(oic.orphan_income_operated_at AS INTEGER)) <= 300
                    AND ((oec.orphan_expense_to_iban IS NOT NULL AND oec.orphan_expense_to_iban = tie.account_iban)
                        OR (oec.orphan_expense_instrument_id = tie.instrument_id AND oec.orphan_expense_amount = tie.amount))
                WHERE oic.orphan_income_account_id = oec.orphan_expense_account_id
            ),
            ranked_matches AS (
                SELECT tm.*, ROW_NUMBER() OVER (
                    PARTITION BY tm.transitive_income_entry_id
                    ORDER BY tm.income_time_diff + tm.expense_time_diff
                ) as match_rank
                FROM transitive_matches tm
            )
            SELECT transfer_transaction_id, transitive_income_entry_id, transitive_income_transaction_id,
                transitive_expense_entry_id, transitive_expense_transaction_id, intermediate_account_id
            FROM ranked_matches WHERE match_rank = 1
        `;
    }
}

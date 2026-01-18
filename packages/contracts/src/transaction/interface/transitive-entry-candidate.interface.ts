export interface TransitiveEntryCandidateInterface {
    transfer_transaction_id: number;
    transitive_income_entry_id: number;
    transitive_income_transaction_id: number;
    transitive_expense_entry_id: number;
    transitive_expense_transaction_id: number;
    intermediate_account_id: number;
}

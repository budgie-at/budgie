export interface TransferPairCandidateInterface {
    expense_transaction_id: number;
    expense_transaction_title: string | null;
    expense_transaction_comment: string | null;
    expense_entry_id: number;
    expense_entry_account_id: number;
    expense_entry_amount: number;
    expense_entry_exchange_rate: number;
    expense_entry_to_iban: string | null;
    income_transaction_id: number;
    income_transaction_title: string | null;
    income_entry_id: number;
    income_entry_account_id: number;
    income_entry_amount: number;
    income_entry_exchange_rate: number;
    income_entry_to_iban: string | null;
    match_type: 'forward' | 'reverse';
}

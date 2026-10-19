-- Mirrors the Travel Card's negative balance to positive so no account card shows a negative amount.

UPDATE account_balances
SET
    amount = amount - 2 * (amount + COALESCE((
        SELECT SUM(CASE WHEN transaction_entries.type = 'DEBIT' THEN transaction_entries.amount ELSE -transaction_entries.amount END)
        FROM transaction_entries
        WHERE transaction_entries.account_id = account_balances.account_id
          AND transaction_entries.deleted_at IS NULL
    ), 0)),
    updated_at = unixepoch('now')
WHERE account_id = 4
  AND amount + COALESCE((
        SELECT SUM(CASE WHEN transaction_entries.type = 'DEBIT' THEN transaction_entries.amount ELSE -transaction_entries.amount END)
        FROM transaction_entries
        WHERE transaction_entries.account_id = account_balances.account_id
          AND transaction_entries.deleted_at IS NULL
    ), 0) < 0;

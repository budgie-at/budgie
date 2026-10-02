-- Halves income below the replayed monthly burn in every locale's currency and pins the liquid anchors so Runway reads as burning with about six months left.

.read shared/long-history.sql

UPDATE transaction_entries
SET amount = amount / 2
WHERE transaction_id IN (SELECT id FROM transactions WHERE type = 'INCOME');

UPDATE account_balances
SET created_at = unixepoch('now'),
    updated_at = unixepoch('now');

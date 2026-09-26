-- Keeps the replayed income above the monthly burn and lifts the main balance so Runway reads as growing with a few months covered.

.read shared/long-history.sql

UPDATE account_balances
SET amount = CASE account_id WHEN 1 THEN amount * 4 ELSE amount END,
    created_at = unixepoch('now'),
    updated_at = unixepoch('now');

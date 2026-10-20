-- Moves every transaction before today back so the previous calendar month ends on its last day with a full month of activity.

CREATE TEMP TABLE overlay_month_shift AS
SELECT CAST(julianday(date('now', 'start of month', '-1 day')) - julianday(date(MAX(operated_at), 'unixepoch')) AS INTEGER) * 86400 AS delta
FROM transactions
WHERE deleted_at IS NULL
  AND date(operated_at, 'unixepoch') < date('now');

UPDATE transaction_entries
SET
    created_at = created_at + (SELECT delta FROM overlay_month_shift),
    updated_at = updated_at + (SELECT delta FROM overlay_month_shift)
WHERE transaction_id IN (SELECT id FROM transactions WHERE date(operated_at, 'unixepoch') < date('now'));

UPDATE transactions
SET
    operated_at = operated_at + (SELECT delta FROM overlay_month_shift),
    created_at = created_at + (SELECT delta FROM overlay_month_shift),
    updated_at = updated_at + (SELECT delta FROM overlay_month_shift)
WHERE date(operated_at, 'unixepoch') < date('now');

UPDATE account_balances
SET
    created_at = created_at + (SELECT delta FROM overlay_month_shift),
    updated_at = updated_at + (SELECT delta FROM overlay_month_shift);

DROP TABLE overlay_month_shift;

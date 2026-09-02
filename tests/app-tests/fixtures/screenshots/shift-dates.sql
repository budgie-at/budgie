-- Re-anchors the showcase dataset on the capture day.
--
-- The fixture is authored against a fixed anchor (2026-09-01). This script
-- shifts every stored date by whole days so the newest transaction lands on
-- "today", which keeps the "this month" analytics buckets and the monthly
-- budget periods populated whenever the screenshots are captured. Dates are
-- epoch seconds, so a whole-day shift preserves each row's time of day.
--
-- Running it twice is a no-op: after the first run the newest transaction is
-- already on the current day, so the computed delta is zero.

CREATE TEMP TABLE showcase_shift AS
SELECT CAST(julianday(date('now')) - julianday(date(MAX(operated_at), 'unixepoch')) AS INTEGER) * 86400 AS delta
FROM transactions
WHERE deleted_at IS NULL;

UPDATE transactions
SET
    operated_at = operated_at + (SELECT delta FROM showcase_shift),
    created_at = created_at + (SELECT delta FROM showcase_shift),
    updated_at = updated_at + (SELECT delta FROM showcase_shift);

UPDATE transaction_entries
SET
    created_at = created_at + (SELECT delta FROM showcase_shift),
    updated_at = updated_at + (SELECT delta FROM showcase_shift);

UPDATE accounts
SET
    created_at = created_at + (SELECT delta FROM showcase_shift),
    updated_at = updated_at + (SELECT delta FROM showcase_shift);

UPDATE account_balances
SET
    created_at = created_at + (SELECT delta FROM showcase_shift),
    updated_at = updated_at + (SELECT delta FROM showcase_shift);

UPDATE tags
SET
    created_at = created_at + (SELECT delta FROM showcase_shift),
    updated_at = updated_at + (SELECT delta FROM showcase_shift);

UPDATE budgets
SET
    created_at = created_at + (SELECT delta FROM showcase_shift),
    updated_at = updated_at + (SELECT delta FROM showcase_shift);

UPDATE budget_category_limits
SET
    created_at = created_at + (SELECT delta FROM showcase_shift),
    updated_at = updated_at + (SELECT delta FROM showcase_shift);

-- The monthly budget period must already be ~20 days in when the screenshot
-- is taken, otherwise a capture on the 1st of a month shows empty budgets.
-- Day-of-month minus 20 keeps the start in the current month late in the
-- month; day-of-month plus 8 pushes it into the previous month early in the
-- month. Both branches stay within 1..28 so every month has that day.
UPDATE budgets
SET period_start_day = CASE
    WHEN CAST(strftime('%d', 'now') AS INTEGER) > 20
        THEN CAST(strftime('%d', 'now') AS INTEGER) - 20
    ELSE CAST(strftime('%d', 'now') AS INTEGER) + 8
END;

-- Exchange rates are displayed with their fetch timestamp, so keep them fresh
-- instead of shifting them along with the ledger.
UPDATE exchange_rates
SET
    created_at = unixepoch('now') - 3600,
    updated_at = unixepoch('now') - 3600;

DROP TABLE showcase_shift;

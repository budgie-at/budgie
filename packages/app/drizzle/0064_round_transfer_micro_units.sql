-- Rounds fractional micro-units left in transaction_entries and account_balances by pre-#1198 cross-currency transfer conversions.
UPDATE transaction_entries
SET amount = CAST(ROUND(amount) AS INTEGER),
    updated_at = unixepoch()
WHERE typeof(amount) = 'real';
--> statement-breakpoint
UPDATE transaction_entries
SET base_amount = CAST(ROUND(base_amount) AS INTEGER),
    updated_at = unixepoch()
WHERE typeof(base_amount) = 'real';
--> statement-breakpoint
UPDATE transaction_entries
SET quoted_amount = CAST(ROUND(quoted_amount) AS INTEGER),
    updated_at = unixepoch()
WHERE typeof(quoted_amount) = 'real';
--> statement-breakpoint
UPDATE transaction_entries
SET quoted_unit_price = CAST(ROUND(quoted_unit_price) AS INTEGER),
    updated_at = unixepoch()
WHERE typeof(quoted_unit_price) = 'real';
--> statement-breakpoint
UPDATE account_balances
SET amount = CAST(ROUND(amount) AS INTEGER),
    updated_at = unixepoch()
WHERE typeof(amount) = 'real';

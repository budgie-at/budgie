UPDATE debt_events
SET amount = CAST(ROUND(amount) AS INTEGER),
    updated_at = unixepoch()
WHERE typeof(amount) = 'real';
--> statement-breakpoint
UPDATE debt_events
SET base_amount = CAST(ROUND(base_amount) AS INTEGER),
    updated_at = unixepoch()
WHERE typeof(base_amount) = 'real';
--> statement-breakpoint
UPDATE account_balances
SET amount = CAST(ROUND(amount) AS INTEGER),
    updated_at = unixepoch()
WHERE typeof(amount) = 'real'
  AND account_id IN (SELECT id FROM accounts WHERE type = 'DEBT');
--> statement-breakpoint
DROP TABLE IF EXISTS debt_integer_ledger_balance_migration;
--> statement-breakpoint
CREATE TEMP TABLE debt_integer_ledger_balance_migration (
    account_id integer PRIMARY KEY NOT NULL,
    ledger_balance integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_integer_ledger_balance_migration (account_id, ledger_balance)
SELECT
    accounts.id,
    CASE accounts.debt_type WHEN 'LENT' THEN remaining.remaining_amount ELSE -remaining.remaining_amount END
FROM accounts
INNER JOIN (
    SELECT
        debt_accounts.id AS account_id,
        CAST(ROUND(MAX(
            CASE
                WHEN opened_totals.opened_amount > 0 THEN opened_totals.opened_amount
                ELSE debt_accounts.target_balance
            END - closed_totals.closed_amount,
            0
        )) AS INTEGER) AS remaining_amount
    FROM accounts debt_accounts
    INNER JOIN (
        SELECT
            accounts_for_open.id AS account_id,
            COALESCE((
                SELECT SUM(opened_events.amount)
                FROM debt_events opened_events
                WHERE opened_events.debt_account_id = accounts_for_open.id
                  AND opened_events.deleted_at IS NULL
                  AND opened_events.direction = 'OPEN'
            ), 0) AS opened_amount
        FROM accounts accounts_for_open
        WHERE accounts_for_open.type = 'DEBT'
    ) opened_totals ON opened_totals.account_id = debt_accounts.id
    INNER JOIN (
        SELECT
            accounts_for_close.id AS account_id,
            COALESCE((
                SELECT SUM(closed_events.amount)
                FROM debt_events closed_events
                WHERE closed_events.debt_account_id = accounts_for_close.id
                  AND closed_events.deleted_at IS NULL
                  AND closed_events.direction = 'CLOSE'
            ), 0) AS closed_amount
        FROM accounts accounts_for_close
        WHERE accounts_for_close.type = 'DEBT'
    ) closed_totals ON closed_totals.account_id = debt_accounts.id
    WHERE debt_accounts.type = 'DEBT'
) remaining ON remaining.account_id = accounts.id
WHERE accounts.type = 'DEBT';
--> statement-breakpoint
UPDATE account_balances
SET amount = (
        SELECT rebuilt.ledger_balance
        FROM debt_integer_ledger_balance_migration rebuilt
        WHERE rebuilt.account_id = account_balances.account_id
    ),
    updated_at = unixepoch()
WHERE account_balances.deleted_at IS NULL
  AND account_balances.account_id IN (SELECT account_id FROM debt_integer_ledger_balance_migration)
  AND account_balances.amount != (
      SELECT rebuilt.ledger_balance
      FROM debt_integer_ledger_balance_migration rebuilt
      WHERE rebuilt.account_id = account_balances.account_id
  );
--> statement-breakpoint
DROP TABLE debt_integer_ledger_balance_migration;

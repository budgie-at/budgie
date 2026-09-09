DROP TABLE IF EXISTS cross_instrument_debt_event_repair_migration;
--> statement-breakpoint
CREATE TEMP TABLE cross_instrument_debt_event_repair_migration (
    debt_event_id integer PRIMARY KEY NOT NULL,
    repaired_amount integer NOT NULL,
    repaired_base_amount integer NOT NULL,
    repaired_base_exchange_rate real NOT NULL
);
--> statement-breakpoint
INSERT INTO cross_instrument_debt_event_repair_migration (debt_event_id, repaired_amount, repaired_base_amount, repaired_base_exchange_rate)
SELECT
    debt_events.id,
    CAST(ROUND(transaction_entries.base_amount / COALESCE(
        (
            SELECT historical_rates.rate * 1.0
            FROM historical_exchange_rates historical_rates
            WHERE historical_rates.source_instrument_id = debt_accounts.instrument_id
              AND historical_rates.target_instrument_id = base_instruments.default_instrument_id
              AND historical_rates.deleted_at IS NULL
              AND historical_rates.rate_date <= date(debt_events.operated_at, 'unixepoch')
            ORDER BY historical_rates.rate_date DESC
            LIMIT 1
        ),
        (
            SELECT 1.0 / (
                SELECT inverse_rates.rate
                FROM historical_exchange_rates inverse_rates
                WHERE inverse_rates.source_instrument_id = base_instruments.default_instrument_id
                  AND inverse_rates.target_instrument_id = debt_accounts.instrument_id
                  AND inverse_rates.deleted_at IS NULL
                  AND inverse_rates.rate_date <= date(debt_events.operated_at, 'unixepoch')
                ORDER BY inverse_rates.rate_date DESC
                LIMIT 1
            )
        ),
        (
            SELECT current_rates.rate * 1.0
            FROM exchange_rates current_rates
            WHERE current_rates.base_instrument_id = debt_accounts.instrument_id
              AND current_rates.quote_instrument_id = base_instruments.default_instrument_id
              AND current_rates.deleted_at IS NULL
            ORDER BY current_rates.created_at DESC
            LIMIT 1
        ),
        (
            SELECT 1.0 / (
                SELECT inverse_current_rates.rate
                FROM exchange_rates inverse_current_rates
                WHERE inverse_current_rates.base_instrument_id = base_instruments.default_instrument_id
                  AND inverse_current_rates.quote_instrument_id = debt_accounts.instrument_id
                  AND inverse_current_rates.deleted_at IS NULL
                ORDER BY inverse_current_rates.created_at DESC
                LIMIT 1
            )
        ),
        1.0
    )) AS INTEGER),
    transaction_entries.base_amount,
    COALESCE(
        (
            SELECT historical_rates.rate * 1.0
            FROM historical_exchange_rates historical_rates
            WHERE historical_rates.source_instrument_id = debt_accounts.instrument_id
              AND historical_rates.target_instrument_id = base_instruments.default_instrument_id
              AND historical_rates.deleted_at IS NULL
              AND historical_rates.rate_date <= date(debt_events.operated_at, 'unixepoch')
            ORDER BY historical_rates.rate_date DESC
            LIMIT 1
        ),
        (
            SELECT 1.0 / (
                SELECT inverse_rates.rate
                FROM historical_exchange_rates inverse_rates
                WHERE inverse_rates.source_instrument_id = base_instruments.default_instrument_id
                  AND inverse_rates.target_instrument_id = debt_accounts.instrument_id
                  AND inverse_rates.deleted_at IS NULL
                  AND inverse_rates.rate_date <= date(debt_events.operated_at, 'unixepoch')
                ORDER BY inverse_rates.rate_date DESC
                LIMIT 1
            )
        ),
        (
            SELECT current_rates.rate * 1.0
            FROM exchange_rates current_rates
            WHERE current_rates.base_instrument_id = debt_accounts.instrument_id
              AND current_rates.quote_instrument_id = base_instruments.default_instrument_id
              AND current_rates.deleted_at IS NULL
            ORDER BY current_rates.created_at DESC
            LIMIT 1
        ),
        (
            SELECT 1.0 / (
                SELECT inverse_current_rates.rate
                FROM exchange_rates inverse_current_rates
                WHERE inverse_current_rates.base_instrument_id = base_instruments.default_instrument_id
                  AND inverse_current_rates.quote_instrument_id = debt_accounts.instrument_id
                  AND inverse_current_rates.deleted_at IS NULL
                ORDER BY inverse_current_rates.created_at DESC
                LIMIT 1
            )
        ),
        1.0
    )
FROM debt_events
INNER JOIN transaction_entries ON transaction_entries.id = debt_events.transaction_entry_id AND transaction_entries.deleted_at IS NULL
INNER JOIN accounts entry_accounts ON entry_accounts.id = transaction_entries.account_id
INNER JOIN accounts debt_accounts ON debt_accounts.id = debt_events.debt_account_id
INNER JOIN (
    SELECT settings.default_instrument_id AS default_instrument_id
    FROM settings
    LIMIT 1
) base_instruments
WHERE debt_events.deleted_at IS NULL
  AND entry_accounts.instrument_id <> debt_accounts.instrument_id
  AND transaction_entries.base_instrument_id = base_instruments.default_instrument_id
  AND transaction_entries.base_amount > 0;
--> statement-breakpoint
UPDATE debt_events
SET amount = (
        SELECT repair.repaired_amount
        FROM cross_instrument_debt_event_repair_migration repair
        WHERE repair.debt_event_id = debt_events.id
    ),
    base_amount = (
        SELECT repair.repaired_base_amount
        FROM cross_instrument_debt_event_repair_migration repair
        WHERE repair.debt_event_id = debt_events.id
    ),
    base_exchange_rate = (
        SELECT repair.repaired_base_exchange_rate
        FROM cross_instrument_debt_event_repair_migration repair
        WHERE repair.debt_event_id = debt_events.id
    ),
    updated_at = unixepoch()
WHERE id IN (SELECT debt_event_id FROM cross_instrument_debt_event_repair_migration);
--> statement-breakpoint
DROP TABLE cross_instrument_debt_event_repair_migration;
--> statement-breakpoint
DROP TABLE IF EXISTS debt_account_balance_repair_migration;
--> statement-breakpoint
CREATE TEMP TABLE debt_account_balance_repair_migration (
    account_id integer PRIMARY KEY NOT NULL,
    ledger_balance integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_account_balance_repair_migration (account_id, ledger_balance)
SELECT
    accounts.id,
    CASE accounts.debt_type WHEN 'LENT' THEN remaining_amount ELSE -remaining_amount END
FROM accounts
INNER JOIN (
    SELECT
        debt_accounts.id AS account_id,
        MAX(
            ROUND(
                CASE
                    WHEN opened_totals.opened_amount > 0 THEN opened_totals.opened_amount
                    ELSE debt_accounts.target_balance
                END - closed_totals.closed_amount,
                0
            ),
            0
        ) AS remaining_amount
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
        SELECT repair.ledger_balance
        FROM debt_account_balance_repair_migration repair
        WHERE repair.account_id = account_balances.account_id
    ),
    updated_at = unixepoch()
WHERE account_id IN (SELECT account_id FROM debt_account_balance_repair_migration);
--> statement-breakpoint
DROP TABLE debt_account_balance_repair_migration;

ALTER TABLE `accounts` ADD `target_base_instrument_id` integer REFERENCES instruments(id) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `target_base_exchange_rate` real;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `target_base_amount` integer;
--> statement-breakpoint
CREATE TEMP TABLE debt_target_base_valuation_migration (
    account_id integer NOT NULL,
    base_instrument_id integer NOT NULL,
    exchange_rate real NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_target_base_valuation_migration (account_id, base_instrument_id, exchange_rate)
SELECT
    accounts.id,
    settings.default_instrument_id,
    CASE
        WHEN accounts.instrument_id = settings.default_instrument_id THEN 1.0
        ELSE COALESCE(
            (
                SELECT historical_exchange_rates.rate * 1.0
                FROM historical_exchange_rates
                WHERE historical_exchange_rates.source_instrument_id = accounts.instrument_id
                  AND historical_exchange_rates.target_instrument_id = settings.default_instrument_id
                  AND historical_exchange_rates.rate_date <= date(accounts.created_at, 'unixepoch')
                  AND historical_exchange_rates.deleted_at IS NULL
                ORDER BY historical_exchange_rates.rate_date DESC
                LIMIT 1
            ),
            (
                SELECT 1.0 / historical_exchange_rates.rate
                FROM historical_exchange_rates
                WHERE historical_exchange_rates.source_instrument_id = settings.default_instrument_id
                  AND historical_exchange_rates.target_instrument_id = accounts.instrument_id
                  AND historical_exchange_rates.rate_date <= date(accounts.created_at, 'unixepoch')
                  AND historical_exchange_rates.deleted_at IS NULL
                ORDER BY historical_exchange_rates.rate_date DESC
                LIMIT 1
            ),
            (
                SELECT historical_exchange_rates.rate * 1.0
                FROM historical_exchange_rates
                WHERE historical_exchange_rates.source_instrument_id = accounts.instrument_id
                  AND historical_exchange_rates.target_instrument_id = settings.default_instrument_id
                  AND historical_exchange_rates.deleted_at IS NULL
                ORDER BY historical_exchange_rates.rate_date ASC
                LIMIT 1
            ),
            (
                SELECT 1.0 / historical_exchange_rates.rate
                FROM historical_exchange_rates
                WHERE historical_exchange_rates.source_instrument_id = settings.default_instrument_id
                  AND historical_exchange_rates.target_instrument_id = accounts.instrument_id
                  AND historical_exchange_rates.deleted_at IS NULL
                ORDER BY historical_exchange_rates.rate_date ASC
                LIMIT 1
            ),
            (
                SELECT exchange_rates.rate * 1.0
                FROM exchange_rates
                WHERE exchange_rates.base_instrument_id = accounts.instrument_id
                  AND exchange_rates.quote_instrument_id = settings.default_instrument_id
                  AND exchange_rates.deleted_at IS NULL
                ORDER BY exchange_rates.created_at DESC
                LIMIT 1
            ),
            (
                SELECT 1.0 / exchange_rates.rate
                FROM exchange_rates
                WHERE exchange_rates.base_instrument_id = settings.default_instrument_id
                  AND exchange_rates.quote_instrument_id = accounts.instrument_id
                  AND exchange_rates.deleted_at IS NULL
                ORDER BY exchange_rates.created_at DESC
                LIMIT 1
            ),
            1.0
        )
    END
FROM accounts
CROSS JOIN settings
WHERE accounts.type = 'DEBT'
  AND accounts.target_balance > 0
  AND accounts.deleted_at IS NULL
  AND settings.default_instrument_id IS NOT NULL
  AND settings.deleted_at IS NULL;
--> statement-breakpoint
UPDATE accounts
SET target_base_instrument_id = (
    SELECT debt_target_base_valuation_migration.base_instrument_id
    FROM debt_target_base_valuation_migration
    WHERE debt_target_base_valuation_migration.account_id = accounts.id
),
target_base_exchange_rate = (
    SELECT debt_target_base_valuation_migration.exchange_rate
    FROM debt_target_base_valuation_migration
    WHERE debt_target_base_valuation_migration.account_id = accounts.id
),
target_base_amount = ROUND(accounts.target_balance * (
    SELECT debt_target_base_valuation_migration.exchange_rate
    FROM debt_target_base_valuation_migration
    WHERE debt_target_base_valuation_migration.account_id = accounts.id
))
WHERE accounts.id IN (
    SELECT debt_target_base_valuation_migration.account_id
    FROM debt_target_base_valuation_migration
);
--> statement-breakpoint
DROP TABLE debt_target_base_valuation_migration;

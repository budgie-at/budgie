#!/bin/bash
# Trims historical_exchange_rates in app E2E fixture databases to the window the flows can read, then VACUUMs.
set -euo pipefail

MARGIN_DAYS="${SLIM_MARGIN_DAYS:-30}"

if ! [[ "$MARGIN_DAYS" =~ ^[0-9]+$ ]]; then
    echo "SLIM_MARGIN_DAYS must be a non-negative integer, got '$MARGIN_DAYS'" >&2
    exit 64
fi

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <fixture.db>..." >&2
    exit 64
fi

for database_path in "$@"; do
    if [ ! -f "$database_path" ]; then
        echo "Fixture database not found: $database_path" >&2
        exit 66
    fi
    if [ -z "$(sqlite3 -bail "$database_path" 'SELECT MAX(rate_date) FROM historical_exchange_rates')" ]; then
        echo "No historical_exchange_rates in $database_path" >&2
        exit 65
    fi
    sqlite3 -bail "$database_path" <<SQL
CREATE TEMP TABLE slim_window AS
SELECT
    date(
        MIN(
            COALESCE(first_transaction_date, latest_rate_date),
            date(latest_rate_date, '-' || CAST(COALESCE(julianday(last_transaction_date) - julianday(first_transaction_date), 0) AS INTEGER) || ' days')
        ),
        '-${MARGIN_DAYS} days'
    ) AS lower_bound
FROM (
    SELECT
        (SELECT date(MIN(operated_at), 'unixepoch') FROM transactions) AS first_transaction_date,
        (SELECT date(MAX(operated_at), 'unixepoch') FROM transactions) AS last_transaction_date,
        (SELECT MAX(rate_date) FROM historical_exchange_rates) AS latest_rate_date
);
CREATE TEMP TABLE slim_keep AS
SELECT id FROM historical_exchange_rates WHERE rate_date >= (SELECT lower_bound FROM slim_window)
UNION
SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY source_instrument_id, target_instrument_id ORDER BY rate_date ASC) AS position
    FROM historical_exchange_rates
) WHERE position = 1
UNION
SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY source_instrument_id, target_instrument_id ORDER BY rate_date DESC) AS position
    FROM historical_exchange_rates
    WHERE rate_date < (SELECT lower_bound FROM slim_window)
) WHERE position = 1;
DELETE FROM historical_exchange_rates WHERE (SELECT lower_bound FROM slim_window) IS NOT NULL AND id NOT IN (SELECT id FROM slim_keep);
DROP TABLE slim_keep;
DROP TABLE slim_window;
VACUUM;
SQL
done

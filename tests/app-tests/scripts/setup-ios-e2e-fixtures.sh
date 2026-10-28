#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
CONTACT_FIXTURE_PATH="$SCRIPT_DIR/../fixtures/maestro-e2e-contact.vcf"
INSTALL_DB_FIXTURE_SCRIPT="$PROJECT_ROOT/scripts/install-ios-db-fixture.sh"
PREPARE_DYNAMIC_FIXTURES_SCRIPT="$SCRIPT_DIR/prepare-date-sensitive-fixtures.js"
STATEMENT_FIXTURE_PATHS="
erste/erste-statement-008.pdf
erste/erste-statement-009.pdf
privatbank/privatbank-statement-001.xlsx
privatbank/privatbank-statement-002.xlsx
receipt/receipt-e2e.pdf
"
CSV_FIXTURE_NAMES="
test-transactions.csv
test15-suggested-rule.csv
test16-rules-import.csv
test17-suggested-rule.csv
test25-duplicate-rule.csv
test27-matching-rules-pill.csv
e2e-mcc-default-category.csv
"
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
APP_DATA_CONTAINER_OVERRIDE="${APP_DATA_CONTAINER:-}"

if [ -n "$APP_DATA_CONTAINER_OVERRIDE" ]; then
    if [ ! -d "$APP_DATA_CONTAINER_OVERRIDE" ]; then
        echo "App data container override is not a directory: $APP_DATA_CONTAINER_OVERRIDE" >&2
        exit 1
    fi

    APP_DATA="$APP_DATA_CONTAINER_OVERRIDE"
else
    APP_DATA=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true)
fi

FIXTURES_DIR="$APP_DATA/Documents/E2EFixtures"
DYNAMIC_FIXTURES_DIR=$(mktemp -d)
NORMALIZED_FIXTURES_DIR="$DYNAMIC_FIXTURES_DIR/normalized"
REQUESTED_FIXTURES=$(printf '%s\n' "$@" | sed '1,2d')

cleanup() {
    rm -rf "$DYNAMIC_FIXTURES_DIR"
}

trap cleanup EXIT

FIAT_RATES_THROUGH_DATE=$(date -v+1d +%F 2>/dev/null || date -d tomorrow +%F)
TODAY_DATE=$(date +%F)

mkdir -p "$NORMALIZED_FIXTURES_DIR"
node "$PREPARE_DYNAMIC_FIXTURES_SCRIPT" "$DYNAMIC_FIXTURES_DIR"

extend_fiat_rates_through() {
    DATABASE_PATH="$1"

    sqlite3 -bail "$DATABASE_PATH" "
WITH RECURSIVE latest AS (
    SELECT rates.source_instrument_id, rates.target_instrument_id, MAX(rates.rate_date) AS rate_date
    FROM historical_exchange_rates AS rates
    JOIN instruments AS source ON source.id = rates.source_instrument_id AND source.type = 'FIAT'
    JOIN instruments AS target ON target.id = rates.target_instrument_id AND target.type = 'FIAT'
    WHERE rates.deleted_at IS NULL
    GROUP BY rates.source_instrument_id, rates.target_instrument_id
),
days(source_instrument_id, target_instrument_id, rate_date, rate) AS (
    SELECT latest.source_instrument_id, latest.target_instrument_id, date(latest.rate_date, '+1 day'), rates.rate
    FROM latest
    JOIN historical_exchange_rates AS rates
        ON rates.source_instrument_id = latest.source_instrument_id
        AND rates.target_instrument_id = latest.target_instrument_id
        AND rates.rate_date = latest.rate_date
        AND rates.deleted_at IS NULL
    WHERE latest.rate_date < '$FIAT_RATES_THROUGH_DATE'
    UNION ALL
    SELECT source_instrument_id, target_instrument_id, date(rate_date, '+1 day'), rate FROM days WHERE rate_date < '$FIAT_RATES_THROUGH_DATE'
)
INSERT INTO historical_exchange_rates (source_instrument_id, target_instrument_id, rate_date, rate)
SELECT source_instrument_id, target_instrument_id, rate_date, rate FROM days;
"
}

mark_unsupported_fiat_instruments() {
    DATABASE_PATH="$1"

    sqlite3 -bail "$DATABASE_PATH" "
INSERT OR IGNORE INTO instrument_market_data_jobs (created_at, updated_at, instrument_id, quote_instrument_id, from_date, to_date, status)
SELECT unixepoch(), unixepoch(), held.id, euro.id, '$TODAY_DATE', '$TODAY_DATE', 'UNSUPPORTED'
FROM instruments AS held
JOIN instruments AS euro ON euro.code = 'EUR' AND euro.type = 'FIAT'
WHERE held.type = 'FIAT'
    AND held.id <> euro.id
    AND held.id IN (
        SELECT instrument_id FROM accounts WHERE deleted_at IS NULL
        UNION
        SELECT default_instrument_id FROM settings
    )
    AND NOT EXISTS (
        SELECT 1 FROM historical_exchange_rates AS rates
        WHERE rates.source_instrument_id = held.id
            AND rates.target_instrument_id = euro.id
            AND rates.deleted_at IS NULL
    );
"
}

install_database_fixture() {
    SOURCE_FIXTURE_PATH="$1"
    TARGET_FIXTURE_NAME="$2"
    NORMALIZED_FIXTURE_PATH="$NORMALIZED_FIXTURES_DIR/$TARGET_FIXTURE_NAME"

    if ! should_install_fixture "$TARGET_FIXTURE_NAME"; then
        return 0
    fi

    cp "$SOURCE_FIXTURE_PATH" "$NORMALIZED_FIXTURE_PATH"
    sqlite3 "$NORMALIZED_FIXTURE_PATH" 'UPDATE settings SET is_screenshot_protection_enabled = 0;'
    extend_fiat_rates_through "$NORMALIZED_FIXTURE_PATH"
    mark_unsupported_fiat_instruments "$NORMALIZED_FIXTURE_PATH"
    install_fixture_file "$NORMALIZED_FIXTURE_PATH" "$TARGET_FIXTURE_NAME"
}

should_install_fixture() {
    TARGET_FIXTURE_NAME="$1"

    if [ -z "$REQUESTED_FIXTURES" ]; then
        return 0
    fi

    printf '%s\n' "$REQUESTED_FIXTURES" | grep -Fxq "$TARGET_FIXTURE_NAME"
}

install_fixture_file() {
    SOURCE_FIXTURE_PATH="$1"
    TARGET_FIXTURE_NAME="$2"

    if ! should_install_fixture "$TARGET_FIXTURE_NAME"; then
        return 0
    fi

    FIXTURE_FOLDER_NAME="${FIXTURE_FOLDER_NAME:-E2EFixtures}" \
        APP_DATA_CONTAINER="$APP_DATA" \
        "$INSTALL_DB_FIXTURE_SCRIPT" "$SOURCE_FIXTURE_PATH" "$TARGET_FIXTURE_NAME" "$SIMULATOR_UDID" "$APP_ID"
}

install_csv_fixture_file() {
    TARGET_FIXTURE_NAME="$1"

    if ! should_install_fixture "$TARGET_FIXTURE_NAME"; then
        return 0
    fi

    FIXTURE_FOLDER_NAME=E2ECsvFixtures \
        APP_DATA_CONTAINER="$APP_DATA" \
        "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/$TARGET_FIXTURE_NAME" "$TARGET_FIXTURE_NAME" "$SIMULATOR_UDID" "$APP_ID"
}

install_statement_fixtures() {
    mkdir -p "$FIXTURES_DIR"

    for STATEMENT_FIXTURE_PATH in $STATEMENT_FIXTURE_PATHS; do
        STATEMENT_FIXTURE_NAME=$(basename "$STATEMENT_FIXTURE_PATH")

        if ! should_install_fixture "$STATEMENT_FIXTURE_NAME"; then
            continue
        fi

        rm -f "$FIXTURES_DIR/$STATEMENT_FIXTURE_NAME"
        cp "$SCRIPT_DIR/../fixtures/$STATEMENT_FIXTURE_PATH" "$FIXTURES_DIR/"
    done
}

remove_managed_fixtures() {
    if [ -z "$APP_DATA" ]; then
        return 0
    fi

    rm -f "$APP_DATA/Documents/E2EFixtures"/*.db 2>/dev/null || true
    rm -f "$APP_DATA/Documents/E2EFixtures/e2e-budgie-import.csv" 2>/dev/null || true

    for STATEMENT_FIXTURE_PATH in $STATEMENT_FIXTURE_PATHS; do
        rm -f "$APP_DATA/Documents/E2EFixtures/$(basename "$STATEMENT_FIXTURE_PATH")" 2>/dev/null || true
    done

    for CSV_FIXTURE_NAME in $CSV_FIXTURE_NAMES; do
        rm -f "$APP_DATA/Documents/E2ECsvFixtures/$CSV_FIXTURE_NAME" 2>/dev/null || true
    done
}

xcrun simctl spawn "$SIMULATOR_UDID" defaults write .GlobalPreferences AppleKeyboards -array 'en_US@sw=QWERTY;hw=Automatic' 'emoji@sw=Emoji' >/dev/null 2>&1 || true
xcrun simctl spawn "$SIMULATOR_UDID" defaults write .GlobalPreferences AppleLanguages -array 'en-US' >/dev/null 2>&1 || true

xcrun simctl terminate "$SIMULATOR_UDID" "$APP_ID" >/dev/null 2>&1 || true
xcrun simctl addmedia "$SIMULATOR_UDID" "$CONTACT_FIXTURE_PATH" >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts "$APP_ID" >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant microphone "$APP_ID" >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts com.vitalyiegorov.budgie.e2e >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant microphone com.vitalyiegorov.budgie.e2e >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts com.vitalyiegorov.budgie.dev >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant microphone com.vitalyiegorov.budgie.dev >/dev/null 2>&1 || true
xcrun simctl terminate "$SIMULATOR_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true

if [ -n "$APP_DATA" ] && [ -d "$APP_DATA/Documents/SQLite" ]; then
    rm -f "$APP_DATA/Documents/SQLite"/budgie.db*
fi

remove_managed_fixtures

install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "01.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "02.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "03.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "04.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "05.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "06.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "19.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/07.db" "07.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/07.db" "17.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/07.db" "18.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/08.db" "08.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/09.db" "09.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/10.db" "10.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/11.db" "11.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/12.db" "12.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/15.db" "15.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/13.db" "13.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "16.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "23.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/14.db" "14.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/20-recurring-calendar.db" "20.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/21.db" "21.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/22.db" "22.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/25.db" "25.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/34-matching-rules.db" "34-matching-rules.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/29.db" "29.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/31-debt.db" "31-debt.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/31-transaction-info.db" "31-transaction-info.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/38-onboarding.db" "38-onboarding.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/uncategorized-inbox.db" "uncategorized-inbox.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/budget-base.db" "budget-base.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/budget-multi-currency.db" "budget-multi-currency.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/42-receipt-scan.db" "42-receipt-scan.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/43-binance-sync-error.db" "43-binance-sync-error.db"
install_fixture_file "$SCRIPT_DIR/../fixtures/e2e-budgie-import.csv" "e2e-budgie-import.csv"

for CSV_FIXTURE_NAME in $CSV_FIXTURE_NAMES; do
    install_csv_fixture_file "$CSV_FIXTURE_NAME"
done

if [ -n "$APP_DATA" ]; then
    install_statement_fixtures
fi

xcrun simctl terminate "$SIMULATOR_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true

#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
CONTACT_FIXTURE_PATH="$SCRIPT_DIR/../fixtures/maestro-e2e-contact.vcf"
ERSTE_FIXTURES_DIR="$SCRIPT_DIR/../fixtures/erste"
INSTALL_DB_FIXTURE_SCRIPT="$PROJECT_ROOT/scripts/install-ios-db-fixture.sh"
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
APP_DATA=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true)
FIXTURES_DIR="$APP_DATA/Documents/E2EFixtures"

xcrun simctl addmedia "$SIMULATOR_UDID" "$CONTACT_FIXTURE_PATH" >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts "$APP_ID" >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant microphone "$APP_ID" >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts com.vitalyiegorov.budgie.e2e >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts com.vitalyiegorov.budgie.dev >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant microphone com.vitalyiegorov.budgie.e2e >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant microphone com.vitalyiegorov.budgie.dev >/dev/null 2>&1 || true
xcrun simctl terminate "$SIMULATOR_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true

if [ -n "$APP_DATA" ] && [ -d "$APP_DATA/Documents/SQLite" ]; then
    rm -f "$APP_DATA/Documents/SQLite"/budgie.db*
fi

"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/19-transactions-filters.db" "e2e-19-transactions-filters.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/00-empty-state.db" "e2e-00-empty-state.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/08-settings-navigation.db" "e2e-08-settings-navigation.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/09-expense-transaction.db" "e2e-09-expense-transaction.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/10-income-transaction.db" "e2e-10-income-transaction.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/11-transfer-transaction.db" "e2e-11-transfer-transaction.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/12-cross-currency-transfer-transaction.db" "e2e-12-cross-currency-transfer-transaction.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/17-expense-to-transfer.db" "e2e-17-expense-to-transfer.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/18-income-to-transfer.db" "e2e-18-income-to-transfer.db" "$SIMULATOR_UDID" "$APP_ID"

if [ -n "$APP_DATA" ]; then
    mkdir -p "$FIXTURES_DIR"
    rm -f "$FIXTURES_DIR/erste-statement-008.pdf"
    rm -f "$FIXTURES_DIR/erste-statement-009.pdf"
    cp "$ERSTE_FIXTURES_DIR/erste-statement-008.pdf" "$FIXTURES_DIR/"
    cp "$ERSTE_FIXTURES_DIR/erste-statement-009.pdf" "$FIXTURES_DIR/"
fi

xcrun simctl terminate "$SIMULATOR_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true

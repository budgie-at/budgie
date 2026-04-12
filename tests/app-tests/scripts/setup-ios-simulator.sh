#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
CONTACT_FIXTURE_PATH="$SCRIPT_DIR/../fixtures/maestro-e2e-contact.vcf"
INSTALL_DB_FIXTURE_SCRIPT="$PROJECT_ROOT/scripts/install-ios-db-fixture.sh"
INSTALL_ERSTE_FIXTURES_SCRIPT="$SCRIPT_DIR/setup-erste-fixtures.sh"
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
APP_DATA=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true)

xcrun simctl addmedia "$SIMULATOR_UDID" "$CONTACT_FIXTURE_PATH" >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts "$APP_ID" >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts com.vitalyiegorov.budgie.e2e >/dev/null 2>&1 || true
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts com.vitalyiegorov.budgie.dev >/dev/null 2>&1 || true
xcrun simctl terminate "$SIMULATOR_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true

if [ -n "$APP_DATA" ] && [ -d "$APP_DATA/Documents/SQLite" ]; then
    rm -f "$APP_DATA/Documents/SQLite"/budgie.db*
fi

"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/19-transactions-filters.db" "e2e-19-transactions-filters.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/20-transactions-account-date.db" "e2e-20-transactions-account-date.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/08-settings-navigation.db" "e2e-08-settings-navigation.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/15-archived-accounts.db" "e2e-15-archived-accounts.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/09-expense-transaction.db" "e2e-09-expense-transaction.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/10-income-transaction.db" "e2e-10-income-transaction.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/13-balance-verification.db" "e2e-13-balance-verification.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/11-transfer-transaction.db" "e2e-11-transfer-transaction.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/12-cross-currency-transfer-transaction.db" "e2e-12-cross-currency-transfer-transaction.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/17-expense-to-transfer.db" "e2e-17-expense-to-transfer.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/18-income-to-transfer.db" "e2e-18-income-to-transfer.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_ERSTE_FIXTURES_SCRIPT" "$SIMULATOR_UDID" "$APP_ID"

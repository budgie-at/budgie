#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
CONTACT_FIXTURE_PATH="$SCRIPT_DIR/../fixtures/maestro-e2e-contact.vcf"
INSTALL_DB_FIXTURE_SCRIPT="$PROJECT_ROOT/scripts/install-ios-db-fixture.sh"

xcrun simctl addmedia booted "$CONTACT_FIXTURE_PATH" >/dev/null 2>&1 || true
xcrun simctl privacy booted grant contacts com.vitalyiegorov.budgie.e2e >/dev/null 2>&1 || true
xcrun simctl privacy booted grant contacts com.vitalyiegorov.budgie.dev >/dev/null 2>&1 || true

"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/19-transactions-filters.db" "e2e-19-transactions-filters.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/20-transactions-account-date.db" "e2e-20-transactions-account-date.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/08-settings-navigation.db" "e2e-08-settings-navigation.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/15-archived-accounts.db" "e2e-15-archived-accounts.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/09-expense-transaction.db" "e2e-09-expense-transaction.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/10-income-transaction.db" "e2e-10-income-transaction.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/13-balance-verification.db" "e2e-13-balance-verification.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/11-transfer-transaction.db" "e2e-11-transfer-transaction.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/12-cross-currency-transfer-transaction.db" "e2e-12-cross-currency-transfer-transaction.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/17-expense-to-transfer.db" "e2e-17-expense-to-transfer.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/18-income-to-transfer.db" "e2e-18-income-to-transfer.db"

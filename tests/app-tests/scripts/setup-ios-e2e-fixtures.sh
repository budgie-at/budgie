#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
CONTACT_FIXTURE_PATH="$SCRIPT_DIR/../fixtures/maestro-e2e-contact.vcf"
INSTALL_DB_FIXTURE_SCRIPT="$PROJECT_ROOT/scripts/install-ios-db-fixture.sh"
PREPARE_DYNAMIC_FIXTURES_SCRIPT="$SCRIPT_DIR/prepare-date-sensitive-fixtures.mjs"
STATEMENT_FIXTURE_PATHS="
erste/erste-statement-008.pdf
erste/erste-statement-009.pdf
privatbank/privatbank-statement-001.xlsx
privatbank/privatbank-statement-002.xlsx
"
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
APP_DATA=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true)
FIXTURES_DIR="$APP_DATA/Documents/E2EFixtures"
DYNAMIC_FIXTURES_DIR=$(mktemp -d)
NORMALIZED_FIXTURES_DIR="$DYNAMIC_FIXTURES_DIR/normalized"

cleanup() {
    rm -rf "$DYNAMIC_FIXTURES_DIR"
}

trap cleanup EXIT

mkdir -p "$NORMALIZED_FIXTURES_DIR"
node "$PREPARE_DYNAMIC_FIXTURES_SCRIPT" "$DYNAMIC_FIXTURES_DIR"

install_database_fixture() {
    SOURCE_FIXTURE_PATH="$1"
    TARGET_FIXTURE_NAME="$2"
    NORMALIZED_FIXTURE_PATH="$NORMALIZED_FIXTURES_DIR/$TARGET_FIXTURE_NAME"

    cp "$SOURCE_FIXTURE_PATH" "$NORMALIZED_FIXTURE_PATH"
    sqlite3 "$NORMALIZED_FIXTURE_PATH" 'UPDATE settings SET is_screenshot_protection_enabled = 0;'
    "$INSTALL_DB_FIXTURE_SCRIPT" "$NORMALIZED_FIXTURE_PATH" "$TARGET_FIXTURE_NAME" "$SIMULATOR_UDID" "$APP_ID"
}

install_statement_fixtures() {
    mkdir -p "$FIXTURES_DIR"

    for STATEMENT_FIXTURE_PATH in $STATEMENT_FIXTURE_PATHS; do
        STATEMENT_FIXTURE_NAME=$(basename "$STATEMENT_FIXTURE_PATH")

        rm -f "$FIXTURES_DIR/$STATEMENT_FIXTURE_NAME"
        cp "$SCRIPT_DIR/../fixtures/$STATEMENT_FIXTURE_PATH" "$FIXTURES_DIR/"
    done
}

xcrun simctl spawn "$SIMULATOR_UDID" defaults write .GlobalPreferences AppleKeyboards -array 'en_US@sw=QWERTY;hw=Automatic' 'emoji@sw=Emoji' >/dev/null 2>&1 || true
xcrun simctl spawn "$SIMULATOR_UDID" defaults write .GlobalPreferences AppleLanguages -array 'en-US' >/dev/null 2>&1 || true

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

if [ -n "$APP_DATA" ]; then
    rm -f "$APP_DATA/Documents/E2EFixtures"/e2e-* 2>/dev/null || true
    rm -f "$APP_DATA/Documents/E2ECsvFixtures"/e2e-* 2>/dev/null || true
fi

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
install_database_fixture "$SCRIPT_DIR/../fixtures/12.db" "15.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/13.db" "13.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "16.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/01.db" "23.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/14.db" "14.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/20-recurring-calendar.db" "20.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/21.db" "21.db"
install_database_fixture "$DYNAMIC_FIXTURES_DIR/22.db" "22.db"
install_database_fixture "$SCRIPT_DIR/../fixtures/rules-base.db" "rules-base.db"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/e2e-budgie-import.csv" "e2e-budgie-import.csv" "$SIMULATOR_UDID" "$APP_ID"

FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test-transactions.csv" "test-transactions.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test15-suggested-rule.csv" "test15-suggested-rule.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test16-rules-import.csv" "test16-rules-import.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test17-suggested-rule.csv" "test17-suggested-rule.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test25-duplicate-rule.csv" "test25-duplicate-rule.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test27-matching-rules-pill.csv" "test27-matching-rules-pill.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/e2e-mcc-default-category.csv" "e2e-mcc-default-category.csv" "$SIMULATOR_UDID" "$APP_ID"

if [ -n "$APP_DATA" ]; then
    install_statement_fixtures
fi

xcrun simctl terminate "$SIMULATOR_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true

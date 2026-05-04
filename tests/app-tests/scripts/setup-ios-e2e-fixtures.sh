#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
CONTACT_FIXTURE_PATH="$SCRIPT_DIR/../fixtures/maestro-e2e-contact.vcf"
ERSTE_FIXTURES_DIR="$SCRIPT_DIR/../fixtures/erste"
INSTALL_DB_FIXTURE_SCRIPT="$PROJECT_ROOT/scripts/install-ios-db-fixture.sh"
PREPARE_DYNAMIC_FIXTURES_SCRIPT="$SCRIPT_DIR/prepare-date-sensitive-fixtures.mjs"
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
APP_DATA=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true)
FIXTURES_DIR="$APP_DATA/Documents/E2EFixtures"
DYNAMIC_FIXTURES_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$DYNAMIC_FIXTURES_DIR"
}

trap cleanup EXIT

node "$PREPARE_DYNAMIC_FIXTURES_SCRIPT" "$DYNAMIC_FIXTURES_DIR"

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

"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/01.db" "01.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/01.db" "02.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/01.db" "03.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/01.db" "04.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/01.db" "05.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/01.db" "06.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/01.db" "19.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/07.db" "07.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/07.db" "17.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/07.db" "18.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/08.db" "08.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/09.db" "09.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/10.db" "10.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/11.db" "11.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/12.db" "12.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/12.db" "15.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/13.db" "13.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$DYNAMIC_FIXTURES_DIR/14.db" "14.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$DYNAMIC_FIXTURES_DIR/20-recurring-calendar.db" "20.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$DYNAMIC_FIXTURES_DIR/21.db" "21.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/rules-base.db" "rules-base.db" "$SIMULATOR_UDID" "$APP_ID"
"$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/e2e-budgie-import.csv" "e2e-budgie-import.csv" "$SIMULATOR_UDID" "$APP_ID"

FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test-transactions.csv" "test-transactions.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test15-suggested-rule.csv" "test15-suggested-rule.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test16-rules-import.csv" "test16-rules-import.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test17-suggested-rule.csv" "test17-suggested-rule.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test25-duplicate-rule.csv" "test25-duplicate-rule.csv" "$SIMULATOR_UDID" "$APP_ID"
FIXTURE_FOLDER_NAME=E2ECsvFixtures "$INSTALL_DB_FIXTURE_SCRIPT" "$SCRIPT_DIR/../fixtures/test27-matching-rules-pill.csv" "test27-matching-rules-pill.csv" "$SIMULATOR_UDID" "$APP_ID"

if [ -n "$APP_DATA" ]; then
    mkdir -p "$FIXTURES_DIR"
    rm -f "$FIXTURES_DIR/erste-statement-008.pdf"
    rm -f "$FIXTURES_DIR/erste-statement-009.pdf"
    cp "$ERSTE_FIXTURES_DIR/erste-statement-008.pdf" "$FIXTURES_DIR/"
    cp "$ERSTE_FIXTURES_DIR/erste-statement-009.pdf" "$FIXTURES_DIR/"
fi

xcrun simctl terminate "$SIMULATOR_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true

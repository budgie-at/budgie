#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
INSTALL_DB_FIXTURE_SCRIPT="$PROJECT_ROOT/scripts/install-ios-db-fixture.sh"
INSTALL_ERSTE_FIXTURES_SCRIPT="$SCRIPT_DIR/setup-erste-fixtures.sh"
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
FIXTURE_ID="${3:-}"

if [ -z "$FIXTURE_ID" ]; then
    echo "Usage: $0 <simulator-udid> <app-id> <fixture-id>" >&2
    exit 1
fi

APP_DATA=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data)
FIXTURES_DIR="$APP_DATA/Documents/E2EFixtures"
APPLICATIONS_DIR=$(dirname "$APP_DATA")
SOURCE_DB="$SCRIPT_DIR/../fixtures/${FIXTURE_ID}.db"
TARGET_DB="e2e-${FIXTURE_ID}.db"
TEMP_DB=""

cleanup() {
    if [ -n "$TEMP_DB" ] && [ -f "$TEMP_DB" ]; then
        rm -f "$TEMP_DB"
    fi
}

trap cleanup EXIT

if [ "$FIXTURE_ID" = "20-transactions-account-date" ]; then
    TEMP_DB=$(mktemp "${TMPDIR:-/tmp}/budgie-e2e-date-fixture.XXXXXX.db")
    cp "$SOURCE_DB" "$TEMP_DB"

    sqlite3 "$TEMP_DB" "
        UPDATE transactions
        SET operated_at = strftime('%s', 'now', 'start of day', '+10 hours', '+43 minutes', '+42 seconds'),
            updated_at = strftime('%s', 'now')
        WHERE comment = 'E2E Filter Expense';

        UPDATE transactions
        SET operated_at = strftime('%s', 'now', 'start of day', '+10 hours', '+44 minutes', '+31 seconds'),
            updated_at = strftime('%s', 'now')
        WHERE comment = 'E2E Filter Income';

        UPDATE transactions
        SET operated_at = strftime('%s', 'now', 'start of day', '+10 hours', '+45 minutes', '+23 seconds'),
            updated_at = strftime('%s', 'now')
        WHERE comment = 'E2E Filter Transfer';
    "

    SOURCE_DB="$TEMP_DB"
fi

xcrun simctl terminate "$SIMULATOR_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true

mkdir -p "$FIXTURES_DIR"
find "$APPLICATIONS_DIR" -path '*/Documents/E2EFixtures' -type d | while IFS= read -r directory; do
    find "$directory" -maxdepth 1 -type f -name 'e2e-*.db' -delete
    cp "$SOURCE_DB" "$directory/$TARGET_DB"
done

"$INSTALL_DB_FIXTURE_SCRIPT" "$SOURCE_DB" "$TARGET_DB" "$SIMULATOR_UDID" "$APP_ID" >/dev/null
"$INSTALL_ERSTE_FIXTURES_SCRIPT" "$SIMULATOR_UDID" "$APP_ID" >/dev/null

#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
INSTALL_SCRIPT="$PROJECT_ROOT/scripts/install-ios-db-fixture.sh"
SETUP_SCRIPT="$SCRIPT_DIR/setup-ios-e2e-fixtures.sh"
TEMP_DIR=$(mktemp -d)
UDID='00000000-0000-0000-0000-000000000001'
APP_ID='com.example.test'
OVERRIDE_CONTAINER="$TEMP_DIR/override-app-data"
FALLBACK_CONTAINER="$TEMP_DIR/fallback-app-data"
XCRUN_LOG="$TEMP_DIR/xcrun.log"

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p \
    "$TEMP_DIR/bin" \
    "$OVERRIDE_CONTAINER/Documents" \
    "$FALLBACK_CONTAINER/Documents"

cat > "$TEMP_DIR/bin/xcrun" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_XCRUN_LOG"

if [ "$1" = simctl ] && [ "$2" = get_app_container ]; then
    if [ "${MOCK_ALLOW_GET_APP_CONTAINER:-false}" != true ]; then
        exit 99
    fi

    printf '%s\n' "$MOCK_FALLBACK_CONTAINER"
fi
EOF
chmod +x "$TEMP_DIR/bin/xcrun"

SOURCE_DB="$TEMP_DIR/source.db"
SOURCE_CSV="$TEMP_DIR/source.csv"
sqlite3 "$SOURCE_DB" 'CREATE TABLE example (value TEXT); INSERT INTO example VALUES ("cached");'
printf '%s\n' 'value' 'cached' > "$SOURCE_CSV"

: > "$XCRUN_LOG"
PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    APP_DATA_CONTAINER="$OVERRIDE_CONTAINER" \
    "$INSTALL_SCRIPT" "$SOURCE_DB" cached.db "$UDID" "$APP_ID" \
    > "$TEMP_DIR/install-db.log" 2>&1
test -f "$OVERRIDE_CONTAINER/Documents/E2EFixtures/cached.db"
test "$(sqlite3 "$OVERRIDE_CONTAINER/Documents/E2EFixtures/cached.db" 'SELECT value FROM example;')" = cached
test "$(grep -c 'simctl get_app_container' "$XCRUN_LOG" || true)" -eq 0

PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    APP_DATA_CONTAINER="$OVERRIDE_CONTAINER" \
    FIXTURE_FOLDER_NAME=E2ECsvFixtures \
    "$INSTALL_SCRIPT" "$SOURCE_CSV" cached.csv "$UDID" "$APP_ID" \
    > "$TEMP_DIR/install-csv.log" 2>&1
test -f "$OVERRIDE_CONTAINER/Documents/E2ECsvFixtures/cached.csv"
test "$(grep -c 'simctl get_app_container' "$XCRUN_LOG" || true)" -eq 0

status=0
PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    APP_DATA_CONTAINER="$TEMP_DIR/missing-app-data" \
    "$INSTALL_SCRIPT" "$SOURCE_DB" invalid.db "$UDID" "$APP_ID" \
    > "$TEMP_DIR/invalid-override.log" 2>&1 || status=$?
test "$status" -eq 1
grep -q 'App data container override is not a directory:' "$TEMP_DIR/invalid-override.log"
test "$(grep -c 'simctl get_app_container' "$XCRUN_LOG" || true)" -eq 0

: > "$XCRUN_LOG"
PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    MOCK_ALLOW_GET_APP_CONTAINER=true \
    MOCK_FALLBACK_CONTAINER="$FALLBACK_CONTAINER" \
    "$INSTALL_SCRIPT" "$SOURCE_DB" fallback.db "$UDID" "$APP_ID" \
    > "$TEMP_DIR/fallback.log" 2>&1
test -f "$FALLBACK_CONTAINER/Documents/E2EFixtures/fallback.db"
test "$(grep -c 'simctl get_app_container' "$XCRUN_LOG")" -eq 1

: > "$XCRUN_LOG"
PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    APP_DATA_CONTAINER="$OVERRIDE_CONTAINER" \
    sh "$SETUP_SCRIPT" "$UDID" "$APP_ID" \
    > "$TEMP_DIR/setup.log" 2>&1
test "$(grep -c 'simctl get_app_container' "$XCRUN_LOG" || true)" -eq 0
test -f "$OVERRIDE_CONTAINER/Documents/E2EFixtures/01.db"
test -f "$OVERRIDE_CONTAINER/Documents/E2EFixtures/e2e-budgie-import.csv"
test -f "$OVERRIDE_CONTAINER/Documents/E2ECsvFixtures/test16-rules-import.csv"

#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <capture-flow-path> <output-fixture-name> [simulator-udid] [app-id]"
    echo "Example: $0 flows/setup/capture-31-debt-fixture.yaml 31-debt.db"
    exit 1
fi

CAPTURE_FLOW_PATH="$1"
OUTPUT_FIXTURE_NAME="$2"
SIMULATOR_UDID="${3:-booted}"
APP_ID="${4:-com.vitalyiegorov.budgie.e2e}"

yarn --cwd "$WORKSPACE_DIR" exec argent flow run "$WORKSPACE_DIR/$CAPTURE_FLOW_PATH" \
    --platform ios \
    --device "$SIMULATOR_UDID" \
    --output "$WORKSPACE_DIR/artifacts/capture"

xcrun simctl terminate "$SIMULATOR_UDID" "$APP_ID" >/dev/null 2>&1 || true
sleep 2

APP_DATA=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data)
SOURCE_DATABASE_PATH="$APP_DATA/Documents/SQLite/budgie.db"
TARGET_FIXTURE_PATH="$WORKSPACE_DIR/fixtures/$OUTPUT_FIXTURE_NAME"

if [ ! -f "$SOURCE_DATABASE_PATH" ]; then
    echo "App database not found: $SOURCE_DATABASE_PATH" >&2
    exit 1
fi

sqlite3 "$SOURCE_DATABASE_PATH" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null
sqlite3 "$SOURCE_DATABASE_PATH" ".backup $TARGET_FIXTURE_PATH"

echo "Captured $TARGET_FIXTURE_PATH"
sqlite3 "$TARGET_FIXTURE_PATH" "SELECT 'accounts', COUNT(*) FROM accounts; SELECT 'transactions', COUNT(*) FROM transactions;"

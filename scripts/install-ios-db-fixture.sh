#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 4 ]; then
    echo "Usage: $0 <fixture-path> [target-filename] [simulator-udid] [app-id]" >&2
    exit 1
fi

FIXTURE_PATH="$1"
TARGET_NAME="${2:-$(basename "$FIXTURE_PATH")}"
SIMULATOR_UDID="${3:-${SIMULATOR_UDID:-}}"
APP_ID="${4:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
WORKING_FIXTURE_PATH="$FIXTURE_PATH"
FIXTURE_FOLDER_NAME="${FIXTURE_FOLDER_NAME:-E2EFixtures}"

if [ ! -f "$FIXTURE_PATH" ]; then
    echo "Fixture not found: $FIXTURE_PATH" >&2
    exit 1
fi

cleanup() {
    if [ "$WORKING_FIXTURE_PATH" != "$FIXTURE_PATH" ] && [ -f "$WORKING_FIXTURE_PATH" ]; then
        rm -f "$WORKING_FIXTURE_PATH"
    fi
}

trap cleanup EXIT

prepare_fixture_copy() {
    if ! command -v sqlite3 >/dev/null 2>&1; then
        return 0
    fi

    sqlite3 "$WORKING_FIXTURE_PATH" 'PRAGMA wal_checkpoint(FULL);'
}

prepare_fixture_copy

if [ -z "$SIMULATOR_UDID" ]; then
    BOOTED_UDIDS="$(
        xcrun simctl list devices booted |
            sed -n 's/.*(\([A-F0-9-]\{36\}\)) (Booted).*/\1/p'
    )"

    BOOTED_COUNT="$(printf '%s\n' "$BOOTED_UDIDS" | sed '/^$/d' | wc -l | tr -d ' ')"
    if [ "$BOOTED_COUNT" -ne 1 ]; then
        echo "Expected exactly 1 booted iOS simulator, found $BOOTED_COUNT." >&2
        xcrun simctl list devices booted >&2 || true
        exit 1
    fi

    SIMULATOR_UDID="$(printf '%s\n' "$BOOTED_UDIDS" | sed -n '1p')"
fi

APP_DATA_CONTAINER="$(
    xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true
)"

if [ -z "$APP_DATA_CONTAINER" ] || [ ! -d "$APP_DATA_CONTAINER" ]; then
    echo "App data container not found for $APP_ID on simulator $SIMULATOR_UDID." >&2
    exit 1
fi

TARGET_DIR="$APP_DATA_CONTAINER/Documents/$FIXTURE_FOLDER_NAME"
mkdir -p "$TARGET_DIR"
cp "$WORKING_FIXTURE_PATH" "$TARGET_DIR/$TARGET_NAME"
echo "Installed $TARGET_NAME into $TARGET_DIR for $APP_ID on $SIMULATOR_UDID"

#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
SETUP_FIXTURES_SCRIPT="${SETUP_FIXTURES_SCRIPT:-$SCRIPT_DIR/setup-ios-e2e-fixtures.sh}"
INSTALL_DB_FIXTURE_SCRIPT="${INSTALL_DB_FIXTURE_SCRIPT:-$PROJECT_ROOT/scripts/install-ios-db-fixture.sh}"
APP_GROUP_IDENTIFIER="group.com.vitalyiegorov.budgie.e2e.wallet-capture"
GUIDE_DB_FIXTURE_PATH="${GUIDE_DB_FIXTURE_PATH:-$WORKSPACE_DIR/fixtures/apple-pay-shortcuts-guide.db}"
APP_GROUP_FIXTURE_DIR="${APP_GROUP_FIXTURE_DIR:-$WORKSPACE_DIR/fixtures/apple-pay-shortcuts-guide-app-group}"
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
INSTALL_BASE_E2E_FIXTURES="${INSTALL_BASE_E2E_FIXTURES:-true}"
APP_GROUP_CONTAINER_OVERRIDE="${APP_GROUP_CONTAINER:-}"

if [ ! -f "$GUIDE_DB_FIXTURE_PATH" ]; then
    echo "Guide database fixture not found: $GUIDE_DB_FIXTURE_PATH" >&2
    exit 1
fi

if [ ! -f "$APP_GROUP_FIXTURE_DIR/accounts.json" ]; then
    echo "Guide App Group accounts seed not found: $APP_GROUP_FIXTURE_DIR/accounts.json" >&2
    exit 1
fi

if [ ! -d "$APP_GROUP_FIXTURE_DIR/captures" ]; then
    echo "Guide App Group captures seed directory not found: $APP_GROUP_FIXTURE_DIR/captures" >&2
    exit 1
fi

if [ "$INSTALL_BASE_E2E_FIXTURES" = true ]; then
    sh "$SETUP_FIXTURES_SCRIPT" "$SIMULATOR_UDID" "$APP_ID"
fi

"$INSTALL_DB_FIXTURE_SCRIPT" "$GUIDE_DB_FIXTURE_PATH" apple-pay-shortcuts-guide.db "$SIMULATOR_UDID" "$APP_ID"

if [ -n "$APP_GROUP_CONTAINER_OVERRIDE" ]; then
    if [ ! -d "$APP_GROUP_CONTAINER_OVERRIDE" ]; then
        echo "App Group container override is not a directory: $APP_GROUP_CONTAINER_OVERRIDE" >&2
        exit 1
    fi

    APP_GROUP_CONTAINER="$APP_GROUP_CONTAINER_OVERRIDE"
else
    APP_GROUP_CONTAINER=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" "$APP_GROUP_IDENTIFIER" 2>/dev/null || true)
fi

if [ -z "$APP_GROUP_CONTAINER" ] || [ ! -d "$APP_GROUP_CONTAINER" ]; then
    echo "App Group container not found for $APP_GROUP_IDENTIFIER on simulator $SIMULATOR_UDID." >&2
    exit 1
fi

mkdir -p "$APP_GROUP_CONTAINER/captures"
rm -f "$APP_GROUP_CONTAINER/accounts.json"
rm -f "$APP_GROUP_CONTAINER/captures"/*.json 2>/dev/null || true
cp "$APP_GROUP_FIXTURE_DIR/accounts.json" "$APP_GROUP_CONTAINER/accounts.json"

for CAPTURE_FIXTURE_PATH in "$APP_GROUP_FIXTURE_DIR/captures"/*.json; do
    if [ -f "$CAPTURE_FIXTURE_PATH" ]; then
        cp "$CAPTURE_FIXTURE_PATH" "$APP_GROUP_CONTAINER/captures/"
    fi
done

echo "Installed apple-pay-shortcuts-guide.db and Wallet capture App Group seeds for $APP_ID on $SIMULATOR_UDID"

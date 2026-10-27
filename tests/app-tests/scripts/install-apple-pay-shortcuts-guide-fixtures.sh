#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
SETUP_FIXTURES_SCRIPT="${SETUP_FIXTURES_SCRIPT:-$SCRIPT_DIR/setup-ios-e2e-fixtures.sh}"
INSTALL_DB_FIXTURE_SCRIPT="${INSTALL_DB_FIXTURE_SCRIPT:-$PROJECT_ROOT/scripts/install-ios-db-fixture.sh}"
GUIDE_DB_FIXTURE_PATH="${GUIDE_DB_FIXTURE_PATH:-$WORKSPACE_DIR/fixtures/apple-pay-shortcuts-guide.db}"
INVOCATIONS_FIXTURE_PATH="${INVOCATIONS_FIXTURE_PATH:-$WORKSPACE_DIR/fixtures/apple-pay-shortcuts-guide-invocations.json}"
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
INSTALL_BASE_E2E_FIXTURES="${INSTALL_BASE_E2E_FIXTURES:-true}"

if [ ! -f "$GUIDE_DB_FIXTURE_PATH" ]; then
    echo "Guide database fixture not found: $GUIDE_DB_FIXTURE_PATH" >&2
    exit 1
fi

if [ ! -f "$INVOCATIONS_FIXTURE_PATH" ]; then
    echo "Guide App Intents invocations seed not found: $INVOCATIONS_FIXTURE_PATH" >&2
    exit 1
fi

if [ "$INSTALL_BASE_E2E_FIXTURES" = true ]; then
    sh "$SETUP_FIXTURES_SCRIPT" "$SIMULATOR_UDID" "$APP_ID"
fi

"$INSTALL_DB_FIXTURE_SCRIPT" "$GUIDE_DB_FIXTURE_PATH" apple-pay-shortcuts-guide.db "$SIMULATOR_UDID" "$APP_ID"

xcrun simctl spawn "$SIMULATOR_UDID" defaults write "$APP_ID" dev.expo.appintents.invocations.pending -data "$(xxd -p "$INVOCATIONS_FIXTURE_PATH" | tr -d '\n')"

echo "Installed apple-pay-shortcuts-guide.db and pending Apple Pay capture invocations for $APP_ID on $SIMULATOR_UDID"

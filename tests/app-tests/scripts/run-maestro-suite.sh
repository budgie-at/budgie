#!/bin/sh

set -eu

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <app-id> [maestro args...]"
    exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

APP_ID="$1"
shift

SUITE_CONFIG_PATH="${MAESTRO_SUITE_CONFIG_PATH:-$WORKSPACE_DIR/suite.config.yaml}"
E2E_RUN_TOKEN="${E2E_RUN_TOKEN:-$(date +%s)}"
SIMULATOR_UDID="${SIMULATOR_UDID:-}"

detect_booted_simulator_udid() {
    if [ -n "$SIMULATOR_UDID" ]; then
        printf '%s\n' "$SIMULATOR_UDID"
        return 0
    fi

    BOOTED_UDIDS="$(
        xcrun simctl list devices booted 2>/dev/null |
            sed -n 's/.*(\([A-F0-9-]\{36\}\)) (Booted).*/\1/p'
    )"
    BOOTED_COUNT="$(printf '%s\n' "$BOOTED_UDIDS" | sed '/^$/d' | wc -l | tr -d ' ')"

    if [ "$BOOTED_COUNT" -ne 1 ]; then
        return 1
    fi

    printf '%s\n' "$BOOTED_UDIDS" | sed -n '1p'
}

refresh_ios_fixtures_if_needed() {
    DETECTED_SIMULATOR_UDID="$(detect_booted_simulator_udid || true)"

    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    APP_DATA_CONTAINER="$(
        xcrun simctl get_app_container "$DETECTED_SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true
    )"

    if [ -z "$APP_DATA_CONTAINER" ]; then
        return 0
    fi

    echo "Refreshing iOS fixtures for $APP_ID on $DETECTED_SIMULATOR_UDID"
    sh "$SCRIPT_DIR/setup-ios-e2e-fixtures.sh" "$DETECTED_SIMULATOR_UDID" "$APP_ID"
}

refresh_ios_fixtures_if_needed

echo "Running Maestro suite from $WORKSPACE_DIR"
maestro test "$WORKSPACE_DIR" \
    -e APP_ID="$APP_ID" \
    -e E2E_RUN_TOKEN="$E2E_RUN_TOKEN" \
    --config "$SUITE_CONFIG_PATH" \
    "$@"

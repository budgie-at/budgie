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
HANDLE_DEV_CLIENT_STARTUP="${HANDLE_DEV_CLIENT_STARTUP:-}"
E2E_RUN_TOKEN="${E2E_RUN_TOKEN:-$(date +%s)}"

if [ -z "$HANDLE_DEV_CLIENT_STARTUP" ]; then
    case "$APP_ID" in
        *.dev|*.development)
            HANDLE_DEV_CLIENT_STARTUP=true
            ;;
        *)
            HANDLE_DEV_CLIENT_STARTUP=false
            ;;
    esac
fi

if [ "$HANDLE_DEV_CLIENT_STARTUP" = "true" ]; then
    echo "Warming up dev client..."
    maestro test \
        -e APP_ID="$APP_ID" \
        -e HANDLE_DEV_CLIENT_STARTUP=true \
        "$WORKSPACE_DIR/flows/subflows/warm-up-dev-client.flow.yaml" 2>/dev/null || true
fi

echo "Running Maestro suite from $WORKSPACE_DIR"
maestro test "$WORKSPACE_DIR" \
    -e APP_ID="$APP_ID" \
    -e HANDLE_DEV_CLIENT_STARTUP="$HANDLE_DEV_CLIENT_STARTUP" \
    -e E2E_RUN_TOKEN="$E2E_RUN_TOKEN" \
    --config "$SUITE_CONFIG_PATH" \
    "$@"

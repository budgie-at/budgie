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

CONFIG_PATH="${MAESTRO_CONFIG_PATH:-$WORKSPACE_DIR/config.yaml}"
SUITE_CONFIG_PATH="${MAESTRO_SUITE_CONFIG_PATH:-$WORKSPACE_DIR/suite.config.yaml}"
HANDLE_DEV_CLIENT_STARTUP="${HANDLE_DEV_CLIENT_STARTUP:-}"
USE_APP_OWNED_RESET="${USE_APP_OWNED_RESET:-}"
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

if [ -z "$USE_APP_OWNED_RESET" ]; then
    case "$APP_ID" in
        *.e2e)
            USE_APP_OWNED_RESET=true
            ;;
        *)
            USE_APP_OWNED_RESET=false
            ;;
    esac
fi

echo "Running ordered Maestro suite from $WORKSPACE_DIR"
maestro test "$WORKSPACE_DIR" \
    -e APP_ID="$APP_ID" \
    -e HANDLE_DEV_CLIENT_STARTUP="$HANDLE_DEV_CLIENT_STARTUP" \
    -e USE_APP_OWNED_RESET="$USE_APP_OWNED_RESET" \
    -e E2E_RUN_TOKEN="$E2E_RUN_TOKEN" \
    --config "$SUITE_CONFIG_PATH" \
    "$@"

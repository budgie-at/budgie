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

echo "Running ordered Maestro suite from $WORKSPACE_DIR"
maestro test "$WORKSPACE_DIR" \
    -e APP_ID="$APP_ID" \
    -e HANDLE_DEV_CLIENT_STARTUP="$HANDLE_DEV_CLIENT_STARTUP" \
    --config "$SUITE_CONFIG_PATH" \
    "$@"

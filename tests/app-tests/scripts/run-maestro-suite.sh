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

echo "Running ordered Maestro suite from $WORKSPACE_DIR"
maestro test "$WORKSPACE_DIR" -e APP_ID="$APP_ID" --config "$SUITE_CONFIG_PATH" "$@"

#!/usr/bin/env sh
set -eu

FLOW_DIR="${1:-flows}"
PROHIBITED_SELECTOR_PATTERN='point:|tapOnPoint|hideKeyboard'
COORDINATE_INTERACTION_PATTERN="(tapOn|longPressOn):[[:space:]]*['\"]?[0-9]+%?,[0-9]+%?['\"]?"

if rg -n "$PROHIBITED_SELECTOR_PATTERN" "$FLOW_DIR"; then
    echo "Maestro flows must not use point taps, tapOnPoint, or hideKeyboard."
    exit 1
fi

if rg -n "$COORDINATE_INTERACTION_PATTERN" "$FLOW_DIR"; then
    echo "Maestro flows must not tap or long-press by coordinates."
    exit 1
fi

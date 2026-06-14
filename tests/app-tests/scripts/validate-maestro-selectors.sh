#!/usr/bin/env sh
set -eu

FLOW_DIR="${1:-flows}"
PROHIBITED_SELECTOR_PATTERN='point:|tapOnPoint|hideKeyboard|tapOn:[[:space:]]*return|pressKey:[[:space:]]*Enter'
COORDINATE_VALUE_PATTERN="[0-9]+%?[[:space:]]*,[[:space:]]*[0-9]+%?"
COORDINATE_INTERACTION_PATTERN="(tapOn|longPressOn):[[:space:]]*['\"]?${COORDINATE_VALUE_PATTERN}['\"]?"
COORDINATE_SWIPE_PATTERN="(start|end):[[:space:]]*['\"]?${COORDINATE_VALUE_PATTERN}['\"]?"
NUMERIC_TAP_PATTERN="tapOn:[[:space:]]*['\"]?[0-9]+['\"]?"

if rg -n "$PROHIBITED_SELECTOR_PATTERN" "$FLOW_DIR"; then
    echo "Maestro flows must not use point taps, tapOnPoint, hideKeyboard, tapOn return, or uppercase pressKey Enter."
    exit 1
fi

if rg -n "$COORDINATE_INTERACTION_PATTERN" "$FLOW_DIR"; then
    echo "Maestro flows must not tap or long-press by coordinates."
    exit 1
fi

if rg -n "$COORDINATE_SWIPE_PATTERN" "$FLOW_DIR"; then
    echo "Maestro flows must not swipe by coordinates."
    exit 1
fi

if rg -n "$NUMERIC_TAP_PATTERN" "$FLOW_DIR"; then
    echo "Maestro flows must tap keypad digits by TransactionKeypad.Digit.* ids."
    exit 1
fi

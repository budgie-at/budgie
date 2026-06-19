#!/usr/bin/env sh
set -eu

FLOW_DIR="${1:-flows}"
PROHIBITED_SELECTOR_PATTERN='point:|tapOnPoint|hideKeyboard|tapOn:[[:space:]]*return|pressKey:[[:space:]]*Enter'
COORDINATE_VALUE_PATTERN="[0-9]+%?[[:space:]]*,[[:space:]]*[0-9]+%?"
COORDINATE_INTERACTION_PATTERN="(tapOn|longPressOn):[[:space:]]*['\"]?${COORDINATE_VALUE_PATTERN}['\"]?"
COORDINATE_SWIPE_PATTERN="(start|end):[[:space:]]*['\"]?${COORDINATE_VALUE_PATTERN}['\"]?"
NUMERIC_TAP_PATTERN="tapOn:[[:space:]]*['\"]?[0-9]+['\"]?"

find_selector_matches() {
    pattern="$1"

    if command -v rg >/dev/null 2>&1; then
        rg -n "$pattern" "$FLOW_DIR"
        return
    fi

    grep -R -E -n "$pattern" "$FLOW_DIR"
}

if find_selector_matches "$PROHIBITED_SELECTOR_PATTERN"; then
    echo "Maestro flows must not use point taps, tapOnPoint, hideKeyboard, tapOn return, or uppercase pressKey Enter."
    exit 1
fi

if find_selector_matches "$COORDINATE_INTERACTION_PATTERN"; then
    echo "Maestro flows must not tap or long-press by coordinates."
    exit 1
fi

if find_selector_matches "$COORDINATE_SWIPE_PATTERN"; then
    echo "Maestro flows must not swipe by coordinates."
    exit 1
fi

if find_selector_matches "$NUMERIC_TAP_PATTERN"; then
    echo "Maestro flows must tap keypad digits by TransactionKeypad.Digit.* ids."
    exit 1
fi

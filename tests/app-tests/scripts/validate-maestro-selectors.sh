#!/usr/bin/env sh
set -eu

FLOW_DIR="${1:-flows}"
PROHIBITED_SELECTOR_PATTERN='tapOnPoint|hideKeyboard|tapOn:[[:space:]]*return|pressKey:[[:space:]]*Enter'
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
    echo "Maestro flows must not use tapOnPoint, hideKeyboard, tapOn return, or uppercase pressKey Enter."
    exit 1
fi

BARE_POINT_TAPS=$(
    find "$FLOW_DIR" -name '*.yaml' -exec awk '
        function flush() { if (point_line && (!has_selector || !is_relative)) { printf "%s:%d\n", FILENAME, point_line } point_line = 0; has_selector = 0 }
        /^[[:space:]]*-[[:space:]]/ { flush() }
        /^[[:space:]]+(id|text):/ { has_selector = 1 }
        /^[[:space:]]+point:/ { point_line = FNR; is_relative = $0 ~ /point:[[:space:]]*[^[:alnum:]]?[0-9]+%,[0-9]+%[^[:alnum:]%,]*$/ }
        END { flush() }
    ' {} \; || true
)

if [ -n "$BARE_POINT_TAPS" ]; then
    printf '%s\n' "$BARE_POINT_TAPS"
    echo "A point: must be a relative \"x%,y%\" value inside a tapOn that also has an id: or text: selector."
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

DEEP_LINK_OPEN_PROBES=$(
    grep -R -E -n "visible:[[:space:]]*['\"]Open['\"]" "$FLOW_DIR" |
        grep -v -e "select-file-from-app-provider.flow.yaml" -e "prime-deep-links.flow.yaml" || true
)

if [ -n "$DEEP_LINK_OPEN_PROBES" ]; then
    printf '%s\n' "$DEEP_LINK_OPEN_PROBES"
    echo "The deep-link Open confirmation fires once per fresh simulator and is handled by flows/setup/prime-deep-links.flow.yaml at suite start; do not add per-call visible: 'Open' probes (each costs ~7s). The native Files picker Open handling lives only in select-file-from-app-provider.flow.yaml."
    exit 1
fi

LONG_OPTIONAL_WAITS=$(
    find "$FLOW_DIR" -name '*.yaml' -exec awk '
        FNR == 1 { block = 0 }
        /-[[:space:]]*extendedWaitUntil/ { block = 1; has_timeout = 0; has_optional = 0; start = FNR; next }
        block && /^[[:space:]]*-[[:space:]]/ { block = 0 }
        block && /timeout:[[:space:]]*([6-9][0-9]{3}|[0-9]{5,})/ { has_timeout = 1 }
        block && /optional:[[:space:]]*true/ { has_optional = 1 }
        block && has_timeout && has_optional {
            printf "%s:%d\n", FILENAME, start
            block = 0
        }
    ' {} + || true
)

if [ -n "$LONG_OPTIONAL_WAITS" ]; then
    printf '%s\n' "$LONG_OPTIONAL_WAITS"
    echo "extendedWaitUntil with optional: true and timeout > 5000 silently burns the full timeout when the element is absent. Use a required wait or keep the optional grace wait at 5000 or less."
    exit 1
fi

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

PRIME_FLOW="$FLOW_DIR/setup/prime-deep-links.flow.yaml"
SUITE_RUNNER="scripts/run-maestro-suite.sh"

if ! grep -E -q 'retryTapIfNoChange:[[:space:]]*true' "$PRIME_FLOW"; then
    echo "The native deep-link confirmation must retry only when the Open tap leaves the dialog unchanged."
    exit 1
fi

if grep -E -n 'maestro .*prime_flow_path.*\|\| true' "$SUITE_RUNNER"; then
    echo "Deep-link priming must fail the suite before business flows run behind an unresolved native dialog."
    exit 1
fi

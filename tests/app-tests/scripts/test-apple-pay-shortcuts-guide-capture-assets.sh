#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TEMP_DIR=$(mktemp -d)
UDID='00000000-0000-0000-0000-000000000001'
APP_ID='com.example.test'
MAESTRO_LOG="$TEMP_DIR/maestro.log"
XCRUN_LOG="$TEMP_DIR/xcrun.log"
ORDER_LOG="$TEMP_DIR/order.log"
ASSET_OUTPUT_DIR="$TEMP_DIR/assets"

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TEMP_DIR/bin"
mkdir -p "$ASSET_OUTPUT_DIR/illustrations"
printf '%s\n' '<svg id="trigger"></svg>' > "$ASSET_OUTPUT_DIR/illustrations/shortcuts-trigger-selection.svg"
printf '%s\n' '<svg id="action"></svg>' > "$ASSET_OUTPUT_DIR/illustrations/shortcuts-action-binding.svg"
printf '%s\n' '<svg id="save"></svg>' > "$ASSET_OUTPUT_DIR/illustrations/shortcuts-save-automation.svg"

cat > "$TEMP_DIR/bin/xcrun" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_XCRUN_LOG"

if [ "$1" = simctl ] && [ "$2" = io ] && [ "$4" = screenshot ]; then
    printf '%s\n' 'png' > "$5"
fi
EOF
chmod +x "$TEMP_DIR/bin/xcrun"

cat > "$TEMP_DIR/bin/cp" <<'EOF'
#!/bin/bash
set -euo pipefail

case "$*" in
    *apple-pay-capture-setup-screen.png.*)
        if [ "${MOCK_FAIL_PROMOTION_COPY:-false}" = true ]; then
            exit 43
        fi
        ;;
esac

/bin/cp "$@"
EOF
chmod +x "$TEMP_DIR/bin/cp"

cat > "$TEMP_DIR/install-apple-pay-shortcuts-guide-fixtures.sh" <<'EOF'
#!/bin/sh
set -eu
printf '%s\n' "install $*" >> "$MOCK_ORDER_LOG"
EOF
chmod +x "$TEMP_DIR/install-apple-pay-shortcuts-guide-fixtures.sh"

cat > "$TEMP_DIR/run-maestro-suite.sh" <<'EOF'
#!/bin/sh
set -eu

if [ "${MAESTRO_SKIP_FIXTURE_REFRESH:-false}" != true ]; then
    exit 44
fi

printf '%s\n' "$*" >> "$MOCK_MAESTRO_LOG"
printf '%s\n' "flow $*" >> "$MOCK_ORDER_LOG"

case "$*" in
    *"$MOCK_FAIL_FLOW"*)
        exit 42
        ;;
esac
EOF
chmod +x "$TEMP_DIR/run-maestro-suite.sh"

printf '%s\n' 'existing-settings' > "$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png"
printf '%s\n' 'existing-setup' > "$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png"
printf '%s\n' 'existing-review' > "$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png"

status=0
PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    MOCK_MAESTRO_LOG="$MAESTRO_LOG" \
    MOCK_ORDER_LOG="$ORDER_LOG" \
    MOCK_FAIL_FLOW='flows/setup/capture-apple-pay-shortcuts-setup.flow.yaml' \
    MOCK_FAIL_PROMOTION_COPY=false \
    RUN_MAESTRO_SUITE_SCRIPT="$TEMP_DIR/run-maestro-suite.sh" \
    INSTALL_GUIDE_FIXTURES_SCRIPT="$TEMP_DIR/install-apple-pay-shortcuts-guide-fixtures.sh" \
    ASSET_OUTPUT_DIR="$ASSET_OUTPUT_DIR" \
    sh "$SCRIPT_DIR/capture-apple-pay-shortcuts-guide-assets.sh" "$UDID" "$APP_ID" > "$TEMP_DIR/capture-failure.log" 2>&1 || status=$?

test "$status" -eq 42
grep -Fxq 'existing-settings' "$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png"
grep -Fxq 'existing-setup' "$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png"
grep -Fxq 'existing-review' "$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png"

: > "$MAESTRO_LOG"
: > "$XCRUN_LOG"
: > "$ORDER_LOG"

status=0
PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    MOCK_MAESTRO_LOG="$MAESTRO_LOG" \
    MOCK_ORDER_LOG="$ORDER_LOG" \
    MOCK_FAIL_FLOW='__never__' \
    MOCK_FAIL_PROMOTION_COPY=true \
    RUN_MAESTRO_SUITE_SCRIPT="$TEMP_DIR/run-maestro-suite.sh" \
    INSTALL_GUIDE_FIXTURES_SCRIPT="$TEMP_DIR/install-apple-pay-shortcuts-guide-fixtures.sh" \
    ASSET_OUTPUT_DIR="$ASSET_OUTPUT_DIR" \
    sh "$SCRIPT_DIR/capture-apple-pay-shortcuts-guide-assets.sh" "$UDID" "$APP_ID" > "$TEMP_DIR/capture-promotion-failure.log" 2>&1 || status=$?

test "$status" -eq 43
grep -Fxq 'existing-settings' "$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png"
grep -Fxq 'existing-setup' "$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png"
grep -Fxq 'existing-review' "$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png"

: > "$MAESTRO_LOG"
: > "$XCRUN_LOG"
: > "$ORDER_LOG"

PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    MOCK_MAESTRO_LOG="$MAESTRO_LOG" \
    MOCK_ORDER_LOG="$ORDER_LOG" \
    MOCK_FAIL_FLOW='__never__' \
    MOCK_FAIL_PROMOTION_COPY=false \
    RUN_MAESTRO_SUITE_SCRIPT="$TEMP_DIR/run-maestro-suite.sh" \
    INSTALL_GUIDE_FIXTURES_SCRIPT="$TEMP_DIR/install-apple-pay-shortcuts-guide-fixtures.sh" \
    ASSET_OUTPUT_DIR="$ASSET_OUTPUT_DIR" \
    sh "$SCRIPT_DIR/capture-apple-pay-shortcuts-guide-assets.sh" "$UDID" "$APP_ID" > "$TEMP_DIR/capture.log" 2>&1

test -s "$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png"
test -s "$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png"
test -s "$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png"
grep -Fxq 'png' "$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png"
grep -Fxq 'png' "$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png"
grep -Fxq 'png' "$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png"
test -s "$ASSET_OUTPUT_DIR/illustrations/shortcuts-trigger-selection.svg"
test -s "$ASSET_OUTPUT_DIR/illustrations/shortcuts-action-binding.svg"
test -s "$ASSET_OUTPUT_DIR/illustrations/shortcuts-save-automation.svg"
grep -Fxq '<svg id="trigger"></svg>' "$ASSET_OUTPUT_DIR/illustrations/shortcuts-trigger-selection.svg"
grep -Fxq '<svg id="action"></svg>' "$ASSET_OUTPUT_DIR/illustrations/shortcuts-action-binding.svg"
grep -Fxq '<svg id="save"></svg>' "$ASSET_OUTPUT_DIR/illustrations/shortcuts-save-automation.svg"
grep -Fq 'flows/setup/capture-apple-pay-shortcuts-settings.flow.yaml' "$MAESTRO_LOG"
grep -Fq 'flows/setup/capture-apple-pay-shortcuts-setup.flow.yaml' "$MAESTRO_LOG"
grep -Fq 'flows/setup/capture-apple-pay-shortcuts-review.flow.yaml' "$MAESTRO_LOG"
test "$(sed -n '1p' "$ORDER_LOG" | cut -d' ' -f1)" = install
test "$(sed -n '2p' "$ORDER_LOG" | cut -d' ' -f1)" = flow
test "$(grep -c '^simctl io '"$UDID"' screenshot ' "$XCRUN_LOG")" -eq 3

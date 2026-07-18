#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TEMP_DIR=$(mktemp -d)
PREPARE_SCRIPT="$SCRIPT_DIR/prepare-ios-maestro-simulator.sh"
UDID='00000000-0000-0000-0000-000000000002'
APP_PATH="$TEMP_DIR/Budgie Test.app"

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TEMP_DIR/bin" "$APP_PATH"

cat > "$TEMP_DIR/bin/xcrun" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_XCRUN_LOG"

if [ "$1" = simctl ] && [ "$2" = bootstatus ]; then
    attempt=$(grep -c '^simctl bootstatus ' "$MOCK_XCRUN_LOG")
    if [ "$attempt" -lt "$MOCK_BOOTSTATUS_SUCCEED_ON" ]; then
        exit 1
    fi
fi
EOF
chmod +x "$TEMP_DIR/bin/xcrun"

run_prepare() {
    local succeed_on="$1"
    local expected_status="$2"
    local status=0

    : > "$TEMP_DIR/xcrun.log"
    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_XCRUN_LOG="$TEMP_DIR/xcrun.log" \
        MOCK_BOOTSTATUS_SUCCEED_ON="$succeed_on" \
        sh "$PREPARE_SCRIPT" "$UDID" "$APP_PATH" \
        > "$TEMP_DIR/console.log" 2>&1 || status=$?

    test "$status" -eq "$expected_status"
}

run_prepare 2 0
test "$(grep -c '^simctl boot ' "$TEMP_DIR/xcrun.log")" -eq 2
test "$(grep -c '^simctl bootstatus ' "$TEMP_DIR/xcrun.log")" -eq 2
test "$(grep -c '^simctl shutdown ' "$TEMP_DIR/xcrun.log")" -eq 1
test "$(grep -c '^simctl install ' "$TEMP_DIR/xcrun.log")" -eq 1
test "$(tail -n 1 "$TEMP_DIR/xcrun.log")" = "simctl install $UDID $APP_PATH"

run_prepare 99 1
test "$(grep -c '^simctl boot ' "$TEMP_DIR/xcrun.log")" -eq 3
test "$(grep -c '^simctl bootstatus ' "$TEMP_DIR/xcrun.log")" -eq 3
test "$(grep -c '^simctl shutdown ' "$TEMP_DIR/xcrun.log")" -eq 3
test "$(grep -c '^simctl install ' "$TEMP_DIR/xcrun.log" || true)" -eq 0

status=0
sh "$PREPARE_SCRIPT" invalid-udid "$APP_PATH" > "$TEMP_DIR/invalid-udid.log" 2>&1 || status=$?
test "$status" -eq 1
grep -q 'A valid simulator UDID is required.' "$TEMP_DIR/invalid-udid.log"

status=0
sh "$PREPARE_SCRIPT" "$UDID" "$TEMP_DIR/Missing.app" > "$TEMP_DIR/invalid-app.log" 2>&1 || status=$?
test "$status" -eq 1
grep -q 'A readable .app bundle directory is required:' "$TEMP_DIR/invalid-app.log"

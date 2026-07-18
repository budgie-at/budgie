#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TEMP_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TEMP_DIR/bin"

MOCK_RUNNER="$TEMP_DIR/run-maestro-suite.sh"
MOCK_PREPARE="$TEMP_DIR/prepare-ios-maestro-simulator.sh"
MOCK_LOG="$TEMP_DIR/runner.log"
EVENT_LOG="$TEMP_DIR/events.log"
ARTIFACT_ROOT="$TEMP_DIR/artifacts"
APP_PATH="$TEMP_DIR/Budgie Test.app"

mkdir -p "$APP_PATH"

cat > "$MOCK_RUNNER" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\t%s\n' "$SIMULATOR_UDID" "$*" >> "$MOCK_LOG"
printf 'runner:%s\n' "$SIMULATOR_UDID" >> "$EVENT_LOG"

if printf '%s\n' "$*" | grep -q 'flows/02.account-cash.flow.yaml'; then
    exit "${MOCK_LANE_2_STATUS:-0}"
fi

exit "${MOCK_LANE_1_STATUS:-0}"
EOF
chmod +x "$MOCK_RUNNER"

cat > "$MOCK_PREPARE" <<'EOF'
#!/bin/bash
set -euo pipefail
printf 'prepare:%s:%s\n' "$1" "$2" >> "$EVENT_LOG"
exit "${MOCK_PREPARE_STATUS:-0}"
EOF
chmod +x "$MOCK_PREPARE"

cat > "$TEMP_DIR/bin/sleep" <<'EOF'
#!/bin/bash
set -euo pipefail
attempt=0

while ! grep -q '^runner:00000000-0000-0000-0000-000000000001$' "$EVENT_LOG"; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 100 ]; then
        echo 'Lane 1 runner did not start before lane 2 stagger.' >&2
        exit 1
    fi
    /bin/sleep 0.01
done

printf 'sleep:%s\n' "$*" >> "$EVENT_LOG"
EOF
chmod +x "$TEMP_DIR/bin/sleep"

run_lanes() {
    local lane_1_status="$1"
    local lane_2_status="$2"
    local expected_status="$3"
    local status=0

    : > "$MOCK_LOG"
    : > "$EVENT_LOG"
    PATH="$TEMP_DIR/bin:$PATH" \
        EVENT_LOG="$EVENT_LOG" \
        MOCK_LOG="$MOCK_LOG" \
        MOCK_LANE_1_STATUS="$lane_1_status" \
        MOCK_LANE_2_STATUS="$lane_2_status" \
        MOCK_PREPARE_STATUS=0 \
        MAESTRO_ARTIFACT_ROOT="$ARTIFACT_ROOT" \
        MAESTRO_LANE_START_STAGGER_SECONDS=120 \
        MAESTRO_LANE_2_APP_PATH="$APP_PATH" \
        MAESTRO_LANE_2_PREPARE_SCRIPT="$MOCK_PREPARE" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        E2E_RUN_TOKEN=test-run \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$TEMP_DIR/console.log" 2>&1 || status=$?

    test "$status" -eq "$expected_status"
    test "$(wc -l < "$MOCK_LOG" | tr -d ' ')" -eq 2
    grep -q '^00000000-0000-0000-0000-000000000001.*flows/08.expense-transaction.flow.yaml' "$MOCK_LOG"
    grep -q '^00000000-0000-0000-0000-000000000002.*flows/02.account-cash.flow.yaml' "$MOCK_LOG"
    grep -q -- '--output .*lane-1-shard-1/report.xml' "$MOCK_LOG"
    grep -q -- '--debug-output .*lane-2-shard-4/debug' "$MOCK_LOG"
    grep -q -- '--test-output-dir .*lane-2-shard-4/test-output' "$MOCK_LOG"
    test -f "$ARTIFACT_ROOT/lane-1-shard-1/maestro-console.log"
    test -f "$ARTIFACT_ROOT/lane-2-shard-4/maestro-console.log"
    test "$(sed -n '1p' "$EVENT_LOG")" = 'runner:00000000-0000-0000-0000-000000000001'
    test "$(sed -n '2p' "$EVENT_LOG")" = 'sleep:120'
    test "$(sed -n '3p' "$EVENT_LOG")" = "prepare:00000000-0000-0000-0000-000000000002:$APP_PATH"
    test "$(sed -n '4p' "$EVENT_LOG")" = 'runner:00000000-0000-0000-0000-000000000002'
}

run_lanes 0 0 0
run_lanes 0 7 7
run_lanes 9 0 9

status=0
MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
    "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
    com.example.test duplicate 1 duplicate 2 \
    > "$TEMP_DIR/distinct.log" 2>&1 || status=$?
test "$status" -eq 1
grep -q 'Two distinct simulator UDIDs are required.' "$TEMP_DIR/distinct.log"

status=0
MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
    "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
    com.example.test '' 1 lane-2 2 \
    > "$TEMP_DIR/missing.log" 2>&1 || status=$?
test "$status" -eq 1
grep -q 'Two distinct simulator UDIDs are required.' "$TEMP_DIR/missing.log"

assert_invalid_stagger() {
    local value="$1"
    local log_name="$2"
    local status=0

    MAESTRO_LANE_START_STAGGER_SECONDS="$value" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$TEMP_DIR/$log_name.log" 2>&1 || status=$?

    test "$status" -eq 1
    grep -q "MAESTRO_LANE_START_STAGGER_SECONDS must be a nonnegative integer; got: $value" "$TEMP_DIR/$log_name.log"
}

assert_invalid_stagger -1 negative-stagger
assert_invalid_stagger 1.5 fractional-stagger

status=0
MAESTRO_LANE_2_PREPARE_SCRIPT="$TEMP_DIR/missing-prepare.sh" \
    MAESTRO_LANE_2_APP_PATH="$APP_PATH" \
    MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
    "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
    com.example.test \
    00000000-0000-0000-0000-000000000001 1 \
    00000000-0000-0000-0000-000000000002 4 \
    > "$TEMP_DIR/invalid-prepare.log" 2>&1 || status=$?
test "$status" -eq 1
grep -q 'MAESTRO_LANE_2_PREPARE_SCRIPT must be a readable file:' "$TEMP_DIR/invalid-prepare.log"

status=0
MAESTRO_LANE_2_PREPARE_SCRIPT="$MOCK_PREPARE" \
    MAESTRO_LANE_2_APP_PATH="$TEMP_DIR/Missing.app" \
    MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
    "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
    com.example.test \
    00000000-0000-0000-0000-000000000001 1 \
    00000000-0000-0000-0000-000000000002 4 \
    > "$TEMP_DIR/invalid-prepare-app.log" 2>&1 || status=$?
test "$status" -eq 1
grep -q 'MAESTRO_LANE_2_APP_PATH must be a readable .app bundle directory:' "$TEMP_DIR/invalid-prepare-app.log"

run_prepare_failure_case() {
    local case_dir="$TEMP_DIR/prepare-failure"
    local status=0

    mkdir -p "$case_dir"
    : > "$case_dir/events.log"
    : > "$case_dir/runner.log"

    PATH="$TEMP_DIR/bin:$PATH" \
        EVENT_LOG="$case_dir/events.log" \
        MOCK_LOG="$case_dir/runner.log" \
        MOCK_LANE_1_STATUS=0 \
        MOCK_LANE_2_STATUS=0 \
        MOCK_PREPARE_STATUS=12 \
        MAESTRO_ARTIFACT_ROOT="$case_dir/artifacts" \
        MAESTRO_LANE_START_STAGGER_SECONDS=120 \
        MAESTRO_LANE_2_APP_PATH="$APP_PATH" \
        MAESTRO_LANE_2_PREPARE_SCRIPT="$MOCK_PREPARE" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        E2E_RUN_TOKEN=prepare-failure \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$case_dir/console.log" 2>&1 || status=$?

    test "$status" -eq 12
    test "$(wc -l < "$case_dir/runner.log" | tr -d ' ')" -eq 1
    grep -q "^prepare:00000000-0000-0000-0000-000000000002:$APP_PATH$" "$case_dir/events.log"
    ! grep -q '^runner:00000000-0000-0000-0000-000000000002$' "$case_dir/events.log"
}

run_prepare_failure_case

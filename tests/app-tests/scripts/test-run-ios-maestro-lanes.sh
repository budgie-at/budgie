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
MOCK_LOG="$TEMP_DIR/runner.log"
EVENT_LOG="$TEMP_DIR/events.log"
ARTIFACT_ROOT="$TEMP_DIR/artifacts"

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
        MAESTRO_ARTIFACT_ROOT="$ARTIFACT_ROOT" \
        MAESTRO_LANE_START_STAGGER_SECONDS=120 \
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
    test "$(sed -n '3p' "$EVENT_LOG")" = 'runner:00000000-0000-0000-0000-000000000002'
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

#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TEMP_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

MOCK_RUNNER="$TEMP_DIR/run-maestro-suite.sh"
MOCK_LOG="$TEMP_DIR/runner.log"
ARTIFACT_ROOT="$TEMP_DIR/artifacts"

cat > "$MOCK_RUNNER" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\t%s\n' "$SIMULATOR_UDID" "$*" >> "$MOCK_LOG"

if printf '%s\n' "$*" | grep -q 'flows/02.account-cash.flow.yaml'; then
    exit "${MOCK_LANE_2_STATUS:-0}"
fi
EOF
chmod +x "$MOCK_RUNNER"

run_lanes() {
    local lane_2_status="$1"
    local status=0

    : > "$MOCK_LOG"
    MOCK_LOG="$MOCK_LOG" \
        MOCK_LANE_2_STATUS="$lane_2_status" \
        MAESTRO_ARTIFACT_ROOT="$ARTIFACT_ROOT" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        E2E_RUN_TOKEN=test-run \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$TEMP_DIR/console.log" 2>&1 || status=$?

    test "$status" -eq "$lane_2_status"
    test "$(wc -l < "$MOCK_LOG" | tr -d ' ')" -eq 2
    grep -q '^00000000-0000-0000-0000-000000000001.*flows/08.expense-transaction.flow.yaml' "$MOCK_LOG"
    grep -q '^00000000-0000-0000-0000-000000000002.*flows/02.account-cash.flow.yaml' "$MOCK_LOG"
    grep -q -- '--output .*lane-1-shard-1/report.xml' "$MOCK_LOG"
    grep -q -- '--debug-output .*lane-2-shard-4/debug' "$MOCK_LOG"
    grep -q -- '--test-output-dir .*lane-2-shard-4/test-output' "$MOCK_LOG"
    test -f "$ARTIFACT_ROOT/lane-1-shard-1/maestro-console.log"
    test -f "$ARTIFACT_ROOT/lane-2-shard-4/maestro-console.log"
}

run_lanes 0
run_lanes 7

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

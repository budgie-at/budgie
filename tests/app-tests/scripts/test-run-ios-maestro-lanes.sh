#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TEMP_DIR=$(mktemp -d)
PIDS_TO_CLEAN=""

cleanup() {
    local pid

    for pid in $PIDS_TO_CLEAN; do
        kill -TERM "$pid" 2>/dev/null || true
        kill -KILL "$pid" 2>/dev/null || true
    done
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

if [ "$SIMULATOR_UDID" = '00000000-0000-0000-0000-000000000001' ]; then
    printf 'fixtures:%s\n' "$SIMULATOR_UDID" >> "$EVENT_LOG"

    if [ "${MOCK_LANE_1_SIGNAL_PREPARED:-true}" = true ]; then
        test -n "${MAESTRO_FIRST_FLOW_PREPARED_PATH:-}"
        mkdir "$MAESTRO_FIRST_FLOW_PREPARED_PATH"
        printf 'prepared:%s\n' "$SIMULATOR_UDID" >> "$EVENT_LOG"

        if [ "${MOCK_LANE_1_BLOCK_AFTER_PREPARED:-false}" = true ]; then
            printf '%s\n' "$$" > "$MOCK_LANE_1_PID_FILE"
            trap '' HUP INT TERM
            while true; do
                /bin/sleep 1
            done
        fi
    else
        if [ "${MOCK_LANE_1_HANG:-false}" = true ]; then
            printf '%s\n' "$$" > "$MOCK_LANE_1_PID_FILE"
            trap '' HUP INT TERM
            while true; do
                /bin/sleep 1
            done
        fi

        /bin/sleep "${MOCK_LANE_1_HOLD_SECONDS:-0}"
        exit "${MOCK_LANE_1_STATUS:-1}"
    fi
fi

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

if [ "${MOCK_PREPARE_BLOCK:-false}" = true ]; then
    printf '%s\n' "$$" > "$MOCK_PREPARE_PID_FILE"
    trap '' HUP INT TERM
    while true; do
        /bin/sleep 1
    done
fi

exit "${MOCK_PREPARE_STATUS:-0}"
EOF
chmod +x "$MOCK_PREPARE"

cat > "$TEMP_DIR/bin/sleep" <<'EOF'
#!/bin/bash
set -euo pipefail
printf 'poll:%s\n' "$*" >> "$EVENT_LOG"
/bin/sleep 0.01
EOF
chmod +x "$TEMP_DIR/bin/sleep"

event_line() {
    grep -n -F -m 1 "$1" "$2" | cut -d: -f1
}

run_lanes() {
    local lane_1_status="$1"
    local lane_2_status="$2"
    local expected_status="$3"
    local status=0
    local fixtures_line
    local prepare_line
    local prepared_line
    local runner_2_line

    : > "$MOCK_LOG"
    : > "$EVENT_LOG"
    PATH="$TEMP_DIR/bin:$PATH" \
        EVENT_LOG="$EVENT_LOG" \
        MOCK_LOG="$MOCK_LOG" \
        MOCK_LANE_1_SIGNAL_PREPARED=true \
        MOCK_LANE_1_STATUS="$lane_1_status" \
        MOCK_LANE_2_STATUS="$lane_2_status" \
        MOCK_PREPARE_STATUS=0 \
        MAESTRO_ARTIFACT_ROOT="$ARTIFACT_ROOT" \
        MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS=10 \
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
    fixtures_line=$(event_line 'fixtures:00000000-0000-0000-0000-000000000001' "$EVENT_LOG")
    prepared_line=$(event_line 'prepared:00000000-0000-0000-0000-000000000001' "$EVENT_LOG")
    prepare_line=$(event_line "prepare:00000000-0000-0000-0000-000000000002:$APP_PATH" "$EVENT_LOG")
    runner_2_line=$(event_line 'runner:00000000-0000-0000-0000-000000000002' "$EVENT_LOG")
    test "$fixtures_line" -lt "$prepared_line"
    test "$prepared_line" -lt "$prepare_line"
    test "$prepare_line" -lt "$runner_2_line"
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

assert_invalid_timeout() {
    local value="$1"
    local log_name="$2"
    local status=0

    MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS="$value" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$TEMP_DIR/$log_name.log" 2>&1 || status=$?

    test "$status" -eq 1
    grep -q "MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS must be a positive integer; got: $value" "$TEMP_DIR/$log_name.log"
}

assert_invalid_timeout 0 zero-timeout
assert_invalid_timeout -1 negative-timeout
assert_invalid_timeout 1.5 fractional-timeout

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
        MOCK_LANE_1_SIGNAL_PREPARED=true \
        MOCK_LANE_1_STATUS=0 \
        MOCK_LANE_2_STATUS=0 \
        MOCK_PREPARE_STATUS=12 \
        MAESTRO_ARTIFACT_ROOT="$case_dir/artifacts" \
        MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS=10 \
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

run_lane_1_preparation_failure_case() {
    local case_dir="$TEMP_DIR/lane-1-preparation-failure"
    local status=0

    mkdir -p "$case_dir"
    : > "$case_dir/events.log"
    : > "$case_dir/runner.log"

    PATH="$TEMP_DIR/bin:$PATH" \
        EVENT_LOG="$case_dir/events.log" \
        MOCK_LOG="$case_dir/runner.log" \
        MOCK_LANE_1_SIGNAL_PREPARED=false \
        MOCK_LANE_1_STATUS=9 \
        MOCK_LANE_2_STATUS=0 \
        MOCK_PREPARE_STATUS=0 \
        MAESTRO_ARTIFACT_ROOT="$case_dir/artifacts" \
        MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS=10 \
        MAESTRO_LANE_2_APP_PATH="$APP_PATH" \
        MAESTRO_LANE_2_PREPARE_SCRIPT="$MOCK_PREPARE" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        E2E_RUN_TOKEN=preparation-failure \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$case_dir/console.log" 2>&1 || status=$?

    test "$status" -eq 9
    test "$(wc -l < "$case_dir/runner.log" | tr -d ' ')" -eq 1
    ! grep -q '^prepare:' "$case_dir/events.log"
    ! grep -q '^runner:00000000-0000-0000-0000-000000000002$' "$case_dir/events.log"
}

run_lane_1_preparation_failure_case

run_preparation_timeout_case() {
    local case_dir="$TEMP_DIR/preparation-timeout"
    local coordinator_finished=false
    local coordinator_pid
    local lane_1_pid
    local status=0
    local attempt

    mkdir -p "$case_dir"
    : > "$case_dir/events.log"
    : > "$case_dir/runner.log"

    PATH="$TEMP_DIR/bin:$PATH" \
        EVENT_LOG="$case_dir/events.log" \
        MOCK_LOG="$case_dir/runner.log" \
        MOCK_LANE_1_HANG=true \
        MOCK_LANE_1_PID_FILE="$case_dir/lane-1.pid" \
        MOCK_LANE_1_SIGNAL_PREPARED=false \
        MOCK_LANE_1_STATUS=0 \
        MOCK_LANE_2_STATUS=0 \
        MOCK_PREPARE_STATUS=0 \
        MAESTRO_ARTIFACT_ROOT="$case_dir/artifacts" \
        MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS=2 \
        MAESTRO_LANE_2_APP_PATH="$APP_PATH" \
        MAESTRO_LANE_2_PREPARE_SCRIPT="$MOCK_PREPARE" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        E2E_RUN_TOKEN=preparation-timeout \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$case_dir/console.log" 2>&1 &
    coordinator_pid=$!
    PIDS_TO_CLEAN="$PIDS_TO_CLEAN $coordinator_pid"

    for ((attempt = 1; attempt <= 200; attempt += 1)); do
        if ! kill -0 "$coordinator_pid" 2>/dev/null; then
            coordinator_finished=true
            break
        fi
        /bin/sleep 0.01
    done

    if [ "$coordinator_finished" != true ]; then
        kill -TERM "$coordinator_pid" 2>/dev/null || true
    fi

    wait "$coordinator_pid" || status=$?
    PIDS_TO_CLEAN=""

    test "$coordinator_finished" = true
    test "$status" -eq 124
    test -s "$case_dir/lane-1.pid"
    lane_1_pid=$(cat "$case_dir/lane-1.pid")
    ! kill -0 "$lane_1_pid" 2>/dev/null
    ! grep -q '^prepare:' "$case_dir/events.log"
    ! grep -q '^runner:00000000-0000-0000-0000-000000000002$' "$case_dir/events.log"
    grep -q 'Timed out waiting 2 seconds for lane 1 first-flow preparation.' "$case_dir/console.log"
}

run_preparation_timeout_case

run_cancel_during_wait_case() {
    local case_dir="$TEMP_DIR/cancel-during-wait"
    local coordinator_pid
    local cancel_path
    local lane_1_descendant_pid
    local lane_1_job_pid
    local lane_1_job_pid_path
    local lane_2_job_pid
    local lane_2_job_pid_path
    local status=0
    local attempt

    mkdir -p "$case_dir"
    : > "$case_dir/events.log"
    : > "$case_dir/runner.log"

    PATH="$TEMP_DIR/bin:$PATH" \
        EVENT_LOG="$case_dir/events.log" \
        MOCK_LOG="$case_dir/runner.log" \
        MOCK_LANE_1_HANG=true \
        MOCK_LANE_1_PID_FILE="$case_dir/lane-1.pid" \
        MOCK_LANE_1_SIGNAL_PREPARED=false \
        MOCK_LANE_1_STATUS=0 \
        MOCK_LANE_2_STATUS=0 \
        MOCK_PREPARE_STATUS=0 \
        MAESTRO_ARTIFACT_ROOT="$case_dir/artifacts" \
        MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS=300 \
        MAESTRO_LANE_2_APP_PATH="$APP_PATH" \
        MAESTRO_LANE_2_PREPARE_SCRIPT="$MOCK_PREPARE" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        E2E_RUN_TOKEN=cancel-during-wait \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$case_dir/console.log" 2>&1 &
    coordinator_pid=$!
    PIDS_TO_CLEAN="$PIDS_TO_CLEAN $coordinator_pid"

    for ((attempt = 1; attempt <= 200; attempt += 1)); do
        if grep -q '^fixtures:00000000-0000-0000-0000-000000000001$' "$case_dir/events.log" 2>/dev/null; then
            break
        fi
        /bin/sleep 0.01
    done

    test -s "$case_dir/lane-1.pid"
    lane_1_descendant_pid=$(cat "$case_dir/lane-1.pid")
    lane_1_job_pid_path=$(find "$case_dir/artifacts" -type f -name lane-1.pid -print -quit)
    lane_2_job_pid_path=$(find "$case_dir/artifacts" -type f -name lane-2.pid -print -quit)
    test -n "$lane_1_job_pid_path"
    test -n "$lane_2_job_pid_path"
    lane_1_job_pid=$(cat "$lane_1_job_pid_path")
    lane_2_job_pid=$(cat "$lane_2_job_pid_path")

    kill -TERM "$coordinator_pid" 2>/dev/null || true
    wait "$coordinator_pid" || status=$?
    PIDS_TO_CLEAN=""

    test "$status" -eq 143
    cancel_path=$(find "$case_dir/artifacts" -type d -name cancelled -print -quit)
    test -n "$cancel_path"
    ! kill -0 "$lane_1_descendant_pid" 2>/dev/null
    ! kill -0 "$lane_1_job_pid" 2>/dev/null
    ! kill -0 "$lane_2_job_pid" 2>/dev/null
    /bin/sleep 0.1
    ! grep -q '^prepare:' "$case_dir/events.log"
    ! grep -q '^runner:00000000-0000-0000-0000-000000000002$' "$case_dir/events.log"
}

run_cancel_during_wait_case

run_cancel_during_prepare_case() {
    local case_dir="$TEMP_DIR/cancel-during-prepare"
    local coordinator_pid
    local lane_1_descendant_pid
    local lane_1_job_pid
    local lane_1_job_pid_path
    local lane_2_job_pid
    local lane_2_job_pid_path
    local prepare_pid
    local status=0
    local attempt

    mkdir -p "$case_dir"
    : > "$case_dir/events.log"
    : > "$case_dir/runner.log"

    PATH="$TEMP_DIR/bin:$PATH" \
        EVENT_LOG="$case_dir/events.log" \
        MOCK_LOG="$case_dir/runner.log" \
        MOCK_LANE_1_BLOCK_AFTER_PREPARED=true \
        MOCK_LANE_1_PID_FILE="$case_dir/lane-1.pid" \
        MOCK_LANE_1_SIGNAL_PREPARED=true \
        MOCK_LANE_1_STATUS=0 \
        MOCK_LANE_2_STATUS=0 \
        MOCK_PREPARE_BLOCK=true \
        MOCK_PREPARE_PID_FILE="$case_dir/prepare.pid" \
        MOCK_PREPARE_STATUS=0 \
        MAESTRO_ARTIFACT_ROOT="$case_dir/artifacts" \
        MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS=300 \
        MAESTRO_LANE_2_APP_PATH="$APP_PATH" \
        MAESTRO_LANE_2_PREPARE_SCRIPT="$MOCK_PREPARE" \
        MAESTRO_SUITE_RUNNER="$MOCK_RUNNER" \
        E2E_RUN_TOKEN=cancel-during-prepare \
        "$SCRIPT_DIR/run-ios-maestro-lanes.sh" \
        com.example.test \
        00000000-0000-0000-0000-000000000001 1 \
        00000000-0000-0000-0000-000000000002 4 \
        > "$case_dir/console.log" 2>&1 &
    coordinator_pid=$!
    PIDS_TO_CLEAN="$PIDS_TO_CLEAN $coordinator_pid"

    for ((attempt = 1; attempt <= 200; attempt += 1)); do
        if [ -s "$case_dir/lane-1.pid" ] && [ -s "$case_dir/prepare.pid" ]; then
            break
        fi
        /bin/sleep 0.01
    done

    test -s "$case_dir/lane-1.pid"
    test -s "$case_dir/prepare.pid"
    lane_1_descendant_pid=$(cat "$case_dir/lane-1.pid")
    prepare_pid=$(cat "$case_dir/prepare.pid")
    lane_1_job_pid_path=$(find "$case_dir/artifacts" -type f -name lane-1.pid -print -quit)
    lane_2_job_pid_path=$(find "$case_dir/artifacts" -type f -name lane-2.pid -print -quit)
    test -n "$lane_1_job_pid_path"
    test -n "$lane_2_job_pid_path"
    lane_1_job_pid=$(cat "$lane_1_job_pid_path")
    lane_2_job_pid=$(cat "$lane_2_job_pid_path")

    kill -TERM "$coordinator_pid"
    wait "$coordinator_pid" || status=$?
    PIDS_TO_CLEAN=""

    test "$status" -eq 143
    ! kill -0 "$lane_1_descendant_pid" 2>/dev/null
    ! kill -0 "$prepare_pid" 2>/dev/null
    ! kill -0 "$lane_1_job_pid" 2>/dev/null
    ! kill -0 "$lane_2_job_pid" 2>/dev/null
    ! grep -q '^runner:00000000-0000-0000-0000-000000000002$' "$case_dir/events.log"
}

run_cancel_during_prepare_case

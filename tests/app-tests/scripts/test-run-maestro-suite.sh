#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
TEMP_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TEMP_DIR/bin" "$TEMP_DIR/app-data/Documents/E2EFixtures" "$TEMP_DIR/app-data/Documents/SQLite" "$TEMP_DIR/flows"
printf 'fixture' > "$TEMP_DIR/app-data/Documents/E2EFixtures/test.db"
printf '%s\n' 'appId: ${APP_ID}' 'env:' '    FIXTURE_ROW_ID_MATCH: test.db' > "$TEMP_DIR/flows/test.flow.yaml"

cat > "$TEMP_DIR/bin/xcrun" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_XCRUN_LOG"

if [ "$1" = simctl ] && [ "$2" = get_app_container ]; then
    printf '%s\n' "$MOCK_APP_DATA"
fi

exit 0
EOF
chmod +x "$TEMP_DIR/bin/xcrun"

cat > "$TEMP_DIR/bin/maestro" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_MAESTRO_LOG"
attempt_count=$(grep -c 'test.flow.yaml' "$MOCK_MAESTRO_LOG" || true)

if [ "$MOCK_FAILURE" = prime_hang ] && printf '%s\n' "$*" | grep -q 'prime-deep-links.flow.yaml'; then
    printf '%s\n' "$$" > "$MOCK_PRIME_PID_FILE"
    exec sleep 3600
fi

if [ "$MOCK_FAILURE" = ax ] && [ "$attempt_count" -eq 1 ]; then
    printf '%s\n' 'kAXErrorInvalidUIElement'
    exit 1
fi

if [ "$MOCK_FAILURE" = assertion ]; then
    printf '%s\n' 'Assertion is false: id: Expected is visible'
    exit 1
fi
EOF
chmod +x "$TEMP_DIR/bin/maestro"

run_case() {
    local failure_kind="$1"
    local expected_status="$2"
    local expected_maestro_calls="$3"
    local expected_shutdown_calls="$4"
    local case_dir="$TEMP_DIR/$failure_kind"
    local status=0

    mkdir -p "$case_dir"

    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_APP_DATA="$TEMP_DIR/app-data" \
        MOCK_FAILURE="$failure_kind" \
        MOCK_MAESTRO_LOG="$case_dir/maestro.log" \
        MOCK_XCRUN_LOG="$case_dir/xcrun.log" \
        SIMULATOR_UDID='00000000-0000-0000-0000-000000000001' \
        sh "$SCRIPT_DIR/run-maestro-suite.sh" com.example.test "$TEMP_DIR/flows/test.flow.yaml" --output "$case_dir/report.xml" --debug-output "$case_dir/artifacts/output" --test-output-dir "$case_dir/results/output" > "$case_dir/console.log" 2>&1 || status=$?

    test "$status" -eq "$expected_status"
    test "$(wc -l < "$case_dir/maestro.log" | tr -d ' ')" -eq "$expected_maestro_calls"
    test "$(grep -c '^--device 00000000-0000-0000-0000-000000000001 test ' "$case_dir/maestro.log")" -eq "$expected_maestro_calls"
    test "$(grep -c '^simctl shutdown ' "$case_dir/xcrun.log" || true)" -eq "$expected_shutdown_calls"

    if [ "$failure_kind" = ax ]; then
        test -f "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/maestro-console.log"
        test -f "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/maestro-console.log"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/debug-output/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/test-output-dir/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/debug-output/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/test-output-dir/output"
        test "$(grep -c -- "--debug-output $case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-[12]/debug-output/output" "$case_dir/maestro.log")" -eq 2
        test "$(grep -c -- "--test-output-dir $case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-[12]/test-output-dir/output" "$case_dir/maestro.log")" -eq 2
    fi

    test -f "$case_dir/flow-timings.tsv"
    grep -q $'index\tflow\tstatus\tattempts\tduration_seconds' "$case_dir/flow-timings.tsv"
    grep -q $'1\ttest.flow.yaml\t' "$case_dir/flow-timings.tsv"
}

run_case ax 0 3 1
run_case assertion 1 2 0

run_prime_hang_case() {
    local case_dir="$TEMP_DIR/prime-hang"
    local suite_pid
    local prime_pid
    local suite_status=0
    local business_flow_started=false
    local attempt

    mkdir -p "$case_dir"

    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_APP_DATA="$TEMP_DIR/app-data" \
        MOCK_FAILURE=prime_hang \
        MOCK_MAESTRO_LOG="$case_dir/maestro.log" \
        MOCK_PRIME_PID_FILE="$case_dir/prime.pid" \
        MOCK_XCRUN_LOG="$case_dir/xcrun.log" \
        PRIME_DEEP_LINK_TIMEOUT_SECONDS=1 \
        SIMULATOR_UDID='00000000-0000-0000-0000-000000000001' \
        sh "$SCRIPT_DIR/run-maestro-suite.sh" com.example.test "$TEMP_DIR/flows/test.flow.yaml" --output "$case_dir/report.xml" > "$case_dir/console.log" 2>&1 &
    suite_pid=$!

    for ((attempt = 1; attempt <= 500; attempt += 1)); do
        if grep -q 'test.flow.yaml' "$case_dir/maestro.log" 2>/dev/null; then
            business_flow_started=true
            break
        fi
        if ! kill -0 "$suite_pid" 2>/dev/null; then
            break
        fi
        sleep 0.01
    done

    if [ "$business_flow_started" != true ]; then
        if [ -f "$case_dir/prime.pid" ]; then
            prime_pid=$(cat "$case_dir/prime.pid")
            kill "$prime_pid" 2>/dev/null || true
        fi
        kill "$suite_pid" 2>/dev/null || true
        wait "$suite_pid" 2>/dev/null || true
        echo "Business flow did not start after the prime timeout." >&2
        return 1
    fi

    wait "$suite_pid" || suite_status=$?
    test "$suite_status" -eq 0
    prime_pid=$(cat "$case_dir/prime.pid")
    if kill -0 "$prime_pid" 2>/dev/null; then
        kill "$prime_pid" 2>/dev/null || true
        echo "Prime Maestro process is still running: $prime_pid" >&2
        return 1
    fi
    grep -q 'test.flow.yaml' "$case_dir/maestro.log"
    grep -q 'Deep-link priming exceeded 1s and was terminated.' "$case_dir/console.log"
}

run_prime_hang_case

#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
TEMP_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TEMP_DIR/bin" "$TEMP_DIR/app-data/Documents/E2EFixtures" "$TEMP_DIR/app-data/Documents/E2ECsvFixtures" "$TEMP_DIR/app-data/Documents/SQLite" "$TEMP_DIR/flows"
printf 'stale' > "$TEMP_DIR/app-data/Documents/E2EFixtures/erste-statement-008.pdf"
printf 'stale' > "$TEMP_DIR/app-data/Documents/E2ECsvFixtures/test-transactions.csv"
printf '%s\n' \
    'appId: ${APP_ID}' \
    'env:' \
    "    FIXTURE_ROW_ID_MATCH: '01.db'" \
    "    FILE_ROW_ID_MATCH: 'e2e-budgie-import(, csv)?'" \
    "    CSV_DISPLAY_NAME: test16-rules-import" > "$TEMP_DIR/flows/test.flow.yaml"

cat > "$TEMP_DIR/bin/xcrun" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_XCRUN_LOG"

if [ "$1" = simctl ] && [ "$2" = get_app_container ]; then
    printf '%s\n' "$MOCK_APP_DATA"
fi
EOF
chmod +x "$TEMP_DIR/bin/xcrun"

cat > "$TEMP_DIR/bin/maestro" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_MAESTRO_LOG"
attempt_count=$(grep -c 'test.flow.yaml' "$MOCK_MAESTRO_LOG" || true)
test_output_dir=''

while [ "$#" -gt 0 ]; do
    if [ "$1" = --test-output-dir ]; then
        shift
        test_output_dir="$1"
    fi

    shift || true
done

if [ "$MOCK_FAILURE" = ax ] && [ "$attempt_count" -eq 1 ]; then
    printf '%s\n' 'kAXErrorInvalidUIElement'
    exit 1
fi

if [ "$MOCK_FAILURE" = ax_artifact ] && [ "$attempt_count" -eq 1 ]; then
    mkdir -p "$test_output_dir/maestro"
    printf '%s\n' 'Underlying Error: Error kAXErrorInvalidUIElement getting snapshot for element' > "$test_output_dir/maestro/xctest_runner.log"
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
    test "$(grep -c '^simctl shutdown ' "$case_dir/xcrun.log" || true)" -eq "$expected_shutdown_calls"
    if ! grep -q 'Refreshing iOS fixtures for com.example.test on 00000000-0000-0000-0000-000000000001 with 3 fixtures' "$case_dir/console.log"; then
        sed -n '1,120p' "$case_dir/console.log"
        exit 1
    fi

    test -f "$TEMP_DIR/app-data/Documents/E2EFixtures/01.db"
    test -f "$TEMP_DIR/app-data/Documents/E2EFixtures/e2e-budgie-import.csv"
    test ! -f "$TEMP_DIR/app-data/Documents/E2EFixtures/erste-statement-008.pdf"
    test -f "$TEMP_DIR/app-data/Documents/E2ECsvFixtures/test16-rules-import.csv"
    test ! -f "$TEMP_DIR/app-data/Documents/E2ECsvFixtures/test-transactions.csv"

    if [ "$failure_kind" = ax ] || [ "$failure_kind" = ax_artifact ]; then
        test -f "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/maestro-console.log"
        test -f "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/maestro-console.log"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/debug-output/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/test-output-dir/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/debug-output/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/test-output-dir/output"
        test "$(grep -c -- "--debug-output $case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-[12]/debug-output/output" "$case_dir/maestro.log")" -eq 2
        test "$(grep -c -- "--test-output-dir $case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-[12]/test-output-dir/output" "$case_dir/maestro.log")" -eq 2
    fi
}

run_case ax 0 3 1
run_case ax_artifact 0 3 1
run_case assertion 1 2 0

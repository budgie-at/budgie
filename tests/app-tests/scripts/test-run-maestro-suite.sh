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

exit 0
EOF
chmod +x "$TEMP_DIR/bin/xcrun"

cat > "$TEMP_DIR/bin/simslim" <<'EOF'
#!/bin/bash
set -euo pipefail
printf 'simslim %s\n' "$*" >> "$MOCK_XCRUN_LOG"
[ "$1" = verify ] && exit 1
exit 0
EOF
chmod +x "$TEMP_DIR/bin/simslim"

export MOBILE_CI_SLIM_HELPER="$TEMP_DIR/slim-simulator.sh"
cat > "$MOBILE_CI_SLIM_HELPER" <<'EOF'
slim_simulator() {
    simslim verify "$1" --profile stub >/dev/null 2>&1 && return 0
    simslim on "$1" --no-reboot --profile stub
}
EOF

cat > "$TEMP_DIR/bin/maestro" <<'EOF'
#!/bin/bash
set -euo pipefail
test_output_dir=''
maestro_args=("$@")

for maestro_arg_index in "${!maestro_args[@]}"; do
    if [ "${maestro_args[$maestro_arg_index]}" = --test-output-dir ]; then
        test_output_dir="${maestro_args[$((maestro_arg_index + 1))]}"
    fi
done

printf '%s\n' "$*" >> "$MOCK_MAESTRO_LOG"
call_count=$(wc -l < "$MOCK_MAESTRO_LOG" | tr -d ' ')

for argument in "$@"; do
    case "$argument" in
        *prime-and-business.flow.yaml)
            cp "$argument" "$MOCK_WRAPPER_PATH"
            ;;
    esac
done

if [ "$MOCK_FAILURE" = ax ] && [ "$call_count" -eq 1 ]; then
    printf '%s\n' 'kAXErrorInvalidUIElement'
    exit 1
fi

if [ "$MOCK_FAILURE" = ax_artifact ] && [ "$call_count" -eq 1 ]; then
    mkdir -p "$test_output_dir/maestro"
    printf '%s\n' 'Underlying Error: Error kAXErrorInvalidUIElement getting snapshot for element' > "$test_output_dir/maestro/xctest_runner.log"
    exit 1
fi

if [ "$MOCK_FAILURE" = assertion ]; then
    printf '%s\n' 'Assertion is false: id: Expected is visible'
    exit 1
fi

if [ "$MOCK_FAILURE" = ax_then_fail ]; then
    if [ "$call_count" -eq 1 ]; then
        printf '%s\n' 'kAXErrorInvalidUIElement'
    else
        printf '%s\n' 'Assertion is false: id: Expected is visible'
    fi
    exit 1
fi

if [ "$MOCK_FAILURE" = ax_twice ]; then
    if [ "$call_count" -lt 3 ]; then
        printf '%s\n' 'java.net.ConnectException: Failed to connect to /127.0.0.1:61655'
        exit 1
    fi
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
    local prime_line
    local business_line

    mkdir -p "$case_dir"

    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_APP_DATA="$TEMP_DIR/app-data" \
        MOCK_FAILURE="$failure_kind" \
        MOCK_MAESTRO_LOG="$case_dir/maestro.log" \
        MOCK_WRAPPER_PATH="$case_dir/prime-and-business.flow.yaml" \
        MOCK_XCRUN_LOG="$case_dir/xcrun.log" \
        SIMULATOR_UDID='00000000-0000-0000-0000-000000000001' \
        sh "$SCRIPT_DIR/run-maestro-suite.sh" com.example.test "$TEMP_DIR/flows/test.flow.yaml" --output "$case_dir/report.xml" --debug-output "$case_dir/artifacts/output" --test-output-dir "$case_dir/results/output" > "$case_dir/console.log" 2>&1 || status=$?

    test "$status" -eq "$expected_status"
    test "$(wc -l < "$case_dir/maestro.log" | tr -d ' ')" -eq "$expected_maestro_calls"
    test "$(grep -c '^--device 00000000-0000-0000-0000-000000000001 test ' "$case_dir/maestro.log")" -eq "$expected_maestro_calls"
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

    if [ "$failure_kind" = ax ]; then
        test "$(grep -c 'prime-and-business.flow.yaml' "$case_dir/maestro.log")" -eq 2
        test "$(grep -c "$TEMP_DIR/flows/test.flow.yaml" "$case_dir/maestro.log" || true)" -eq 0
    fi

    if [ "$failure_kind" = ax_artifact ] || [ "$failure_kind" = ax_twice ]; then
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-$expected_maestro_calls/debug-output/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-$expected_maestro_calls/test-output-dir/output"
    fi

    if [ "$failure_kind" = combined ]; then
        test -f "$case_dir/prime-and-business.flow.yaml"
        ruby -ryaml -e '
            documents = YAML.load_stream(File.read(ARGV.fetch(0)))
            abort "unexpected wrapper name" unless documents.fetch(0).fetch("name") == "test.flow"
        ' "$case_dir/prime-and-business.flow.yaml"
        test "$(grep -c '^- runFlow:' "$case_dir/prime-and-business.flow.yaml")" -eq 2
        test "$(grep -c 'optional: true' "$case_dir/prime-and-business.flow.yaml" || true)" -eq 0
        prime_line=$(grep -n 'prime-deep-links.flow.yaml' "$case_dir/prime-and-business.flow.yaml" | cut -d: -f1)
        business_line=$(grep -n "$TEMP_DIR/flows/test.flow.yaml" "$case_dir/prime-and-business.flow.yaml" | cut -d: -f1)
        test "$prime_line" -lt "$business_line"
    fi
}

run_case ax 0 2 1
run_case ax_artifact 0 2 1
run_case ax_twice 0 3 2
run_case assertion 1 1 0
run_case ax_then_fail 1 2 1
run_case combined 0 1 0

run_missing_prime_case() {
    local case_dir="$TEMP_DIR/missing-prime"
    local missing_prime_path="$case_dir/missing-prime.flow.yaml"
    local status=0

    mkdir -p "$case_dir"

    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_APP_DATA="$TEMP_DIR/app-data" \
        MOCK_FAILURE=combined \
        MOCK_MAESTRO_LOG="$case_dir/maestro.log" \
        MOCK_WRAPPER_PATH="$case_dir/prime-and-business.flow.yaml" \
        MOCK_XCRUN_LOG="$case_dir/xcrun.log" \
        MAESTRO_PRIME_FLOW_PATH="$missing_prime_path" \
        SIMULATOR_UDID='00000000-0000-0000-0000-000000000001' \
        sh "$SCRIPT_DIR/run-maestro-suite.sh" com.example.test "$TEMP_DIR/flows/test.flow.yaml" --output "$case_dir/report.xml" > "$case_dir/console.log" 2>&1 || status=$?

    test "$status" -eq 1
    test ! -e "$case_dir/maestro.log"
    test ! -e "$case_dir/prime-and-business.flow.yaml"
    grep -Fq "Required deep-link prime flow is missing: $missing_prime_path" "$case_dir/console.log"
}

run_missing_prime_case

run_quoted_path_case() {
    local case_dir="$TEMP_DIR/quoted-path"
    local business_flow_name="space apostrophe' double\" backslash\\test.flow.yaml"
    local business_flow_path="$TEMP_DIR/flows/$business_flow_name"
    local wrapper_path="$case_dir/prime-and-business.flow.yaml"
    local expected_flow_name="${business_flow_name%.yaml}"

    mkdir -p "$case_dir"
    printf '%s\n' 'appId: ${APP_ID}' '---' > "$business_flow_path"

    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_APP_DATA="$TEMP_DIR/app-data" \
        MOCK_FAILURE=combined \
        MOCK_MAESTRO_LOG="$case_dir/maestro.log" \
        MOCK_WRAPPER_PATH="$wrapper_path" \
        MOCK_XCRUN_LOG="$case_dir/xcrun.log" \
        SIMULATOR_UDID='00000000-0000-0000-0000-000000000001' \
        sh "$SCRIPT_DIR/run-maestro-suite.sh" com.example.test "$business_flow_path" --output "$case_dir/report.xml" > "$case_dir/console.log" 2>&1

    ruby -ryaml -e '
        documents = YAML.load_stream(File.read(ARGV.fetch(0)))
        abort "unexpected wrapper name" unless documents.fetch(0).fetch("name") == ARGV.fetch(1)
        commands = documents.fetch(1)
        abort "unexpected prime path" unless commands.fetch(0).fetch("runFlow").fetch("file") == ARGV.fetch(2)
        abort "unexpected business path" unless commands.fetch(1).fetch("runFlow").fetch("file") == ARGV.fetch(3)
    ' "$wrapper_path" "$expected_flow_name" "$WORKSPACE_DIR/flows/setup/prime-deep-links.flow.yaml" "$business_flow_path"
}

run_continue_after_failure_case() {
    local case_dir="$TEMP_DIR/continue-after-failure"
    local second_flow_path="$TEMP_DIR/flows/test-second.flow.yaml"
    local status=0

    mkdir -p "$case_dir"
    printf '%s\n' 'appId: ${APP_ID}' '---' > "$second_flow_path"

    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_APP_DATA="$TEMP_DIR/app-data" \
        MOCK_FAILURE=assertion \
        MOCK_MAESTRO_LOG="$case_dir/maestro.log" \
        MOCK_WRAPPER_PATH="$case_dir/prime-and-business.flow.yaml" \
        MOCK_XCRUN_LOG="$case_dir/xcrun.log" \
        SIMULATOR_UDID='00000000-0000-0000-0000-000000000001' \
        sh "$SCRIPT_DIR/run-maestro-suite.sh" com.example.test "$TEMP_DIR/flows/test.flow.yaml" "$second_flow_path" --output "$case_dir/report.xml" > "$case_dir/console.log" 2>&1 || status=$?

    # A failing first flow must not stop the suite: both flows run, the suite
    # still exits non-zero, and every failed flow is named in the summary.
    test "$status" -eq 1
    test "$(wc -l < "$case_dir/maestro.log" | tr -d ' ')" -eq 2
    grep -Fq 'Flow failed, continuing with remaining flows: test.flow.yaml (1/2)' "$case_dir/console.log"
    grep -Fq 'Maestro suite finished with failures: test.flow.yaml, test-second.flow.yaml' "$case_dir/console.log"
}

run_continue_after_failure_case

run_quoted_path_case

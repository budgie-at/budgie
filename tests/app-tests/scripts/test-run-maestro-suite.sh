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
printf '%s\n' 'appId: ${APP_ID}' 'env:' '    FIXTURE_ROW_ID_MATCH: "test.db"' > "$TEMP_DIR/flows/test.flow.yaml"

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

if [ -n "${MAESTRO_FIRST_FLOW_PREPARED_PATH:-}" ]; then
    if [ ! -d "$MAESTRO_FIRST_FLOW_PREPARED_PATH" ]; then
        echo "First-flow preparation signal missing before Maestro: $MAESTRO_FIRST_FLOW_PREPARED_PATH" >&2
        exit 98
    fi
    if [ ! -f "$MOCK_APP_DATA/Documents/SQLite/budgie.db" ]; then
        echo "Database fixture missing before Maestro." >&2
        exit 97
    fi
fi

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
    local signal_prepared="${5:-true}"
    local case_dir="$TEMP_DIR/$failure_kind"
    local prepared_path
    local status=0
    local prime_line
    local business_line

    mkdir -p "$case_dir"

    if [ "$signal_prepared" = true ]; then
        prepared_path="$case_dir/first-flow-prepared"
    else
        prepared_path=""
    fi

    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_APP_DATA="$TEMP_DIR/app-data" \
        MOCK_FAILURE="$failure_kind" \
        MOCK_MAESTRO_LOG="$case_dir/maestro.log" \
        MOCK_WRAPPER_PATH="$case_dir/prime-and-business.flow.yaml" \
        MOCK_XCRUN_LOG="$case_dir/xcrun.log" \
        MAESTRO_FIRST_FLOW_PREPARED_PATH="$prepared_path" \
        SIMULATOR_UDID='00000000-0000-0000-0000-000000000001' \
        sh "$SCRIPT_DIR/run-maestro-suite.sh" com.example.test "$TEMP_DIR/flows/test.flow.yaml" --output "$case_dir/report.xml" --debug-output "$case_dir/artifacts/output" --test-output-dir "$case_dir/results/output" > "$case_dir/console.log" 2>&1 || status=$?

    test "$status" -eq "$expected_status"
    test "$(wc -l < "$case_dir/maestro.log" | tr -d ' ')" -eq "$expected_maestro_calls"
    test "$(grep -c '^--device 00000000-0000-0000-0000-000000000001 test ' "$case_dir/maestro.log")" -eq "$expected_maestro_calls"
    test "$(grep -c '^simctl shutdown ' "$case_dir/xcrun.log" || true)" -eq "$expected_shutdown_calls"
    test "$(grep -c '^simctl get_app_container ' "$case_dir/xcrun.log" || true)" -eq 1

    if [ "$signal_prepared" = true ]; then
        test -d "$prepared_path"
    fi

    if [ "$failure_kind" = ax ]; then
        test "$(grep -c 'prime-and-business.flow.yaml' "$case_dir/maestro.log")" -eq 2
        test "$(grep -c "$TEMP_DIR/flows/test.flow.yaml" "$case_dir/maestro.log" || true)" -eq 0
        test -f "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/maestro-console.log"
        test -f "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/maestro-console.log"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/debug-output/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-1/test-output-dir/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/debug-output/output"
        test -d "$case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-2/test-output-dir/output"
        test "$(grep -c -- "--debug-output $case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-[12]/debug-output/output" "$case_dir/maestro.log")" -eq 2
        test "$(grep -c -- "--test-output-dir $case_dir/.maestro-flow-attempts/1-test.flow.yaml/attempt-[12]/test-output-dir/output" "$case_dir/maestro.log")" -eq 2
    fi

    if [ "$failure_kind" = combined ]; then
        test -f "$case_dir/prime-and-business.flow.yaml"
        ruby -ryaml -e '
            documents = YAML.load_stream(File.read(ARGV.fetch(0)))
            abort "unexpected wrapper name" unless documents.fetch(0).fetch("name") == "test.flow"
        ' "$case_dir/prime-and-business.flow.yaml"
        test "$(grep -c '^- runFlow:' "$case_dir/prime-and-business.flow.yaml")" -eq 2
        grep -q 'optional: true' "$case_dir/prime-and-business.flow.yaml"
        prime_line=$(grep -n 'prime-deep-links.flow.yaml' "$case_dir/prime-and-business.flow.yaml" | cut -d: -f1)
        business_line=$(grep -n "$TEMP_DIR/flows/test.flow.yaml" "$case_dir/prime-and-business.flow.yaml" | cut -d: -f1)
        test "$prime_line" -lt "$business_line"
    fi

    test -f "$case_dir/flow-timings.tsv"
    grep -q $'index\tflow\tstatus\tattempts\tduration_seconds' "$case_dir/flow-timings.tsv"
    grep -q $'1\ttest.flow.yaml\t' "$case_dir/flow-timings.tsv"
}

run_case ax 0 2 1
run_case assertion 1 1 0
run_case combined 0 1 0
run_case no-signal 0 1 0 false

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

run_quoted_path_case

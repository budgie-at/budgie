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

    if ! grep -q 'Refreshing iOS fixtures for com.example.test on 00000000-0000-0000-0000-000000000001 with 3 fixtures' "$case_dir/console.log"; then
        sed -n '1,120p' "$case_dir/console.log"
        exit 1
    fi

    test -f "$TEMP_DIR/app-data/Documents/E2EFixtures/01.db"
    test -f "$TEMP_DIR/app-data/Documents/E2EFixtures/e2e-budgie-import.csv"
    test ! -f "$TEMP_DIR/app-data/Documents/E2EFixtures/erste-statement-008.pdf"
    test -f "$TEMP_DIR/app-data/Documents/E2ECsvFixtures/test16-rules-import.csv"
    test ! -f "$TEMP_DIR/app-data/Documents/E2ECsvFixtures/test-transactions.csv"

    if [ "$signal_prepared" = true ]; then
        test -d "$prepared_path"
    fi

    if [ "$failure_kind" = ax ]; then
        test "$(grep -c 'prime-and-business.flow.yaml' "$case_dir/maestro.log")" -eq 2
        test "$(grep -c "$TEMP_DIR/flows/test.flow.yaml" "$case_dir/maestro.log" || true)" -eq 0
    fi

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

    test -f "$case_dir/flow-timings.tsv"
    grep -q $'index\tflow\tstatus\tattempts\tduration_seconds' "$case_dir/flow-timings.tsv"
    grep -q $'1\ttest.flow.yaml\t' "$case_dir/flow-timings.tsv"
}

run_case ax 0 2 1
run_case ax_artifact 0 2 1
run_case assertion 1 1 0
run_case ax_then_fail 1 2 1
run_case combined 0 1 0
run_case no-signal 0 1 0 false

ruby -ryaml -e '
    documents = YAML.load_stream(File.read(ARGV.fetch(0)))
    commands = documents.fetch(1)

    probe = commands.fetch(0).fetch("openLink")
    abort "recovery probe must open the transactions deep link" unless probe.fetch("link") == "budgie://transactions"
    abort "only the recovery probe may tolerate an openLink timeout" unless probe.fetch("optional") == true

    prime_retry = commands.fetch(1).fetch("retry")
    abort "prime retry count must be bounded" unless prime_retry.fetch("maxRetries") == 2

    prime_commands = prime_retry.fetch("commands")
    prompt_flow = prime_commands.fetch(0).fetch("runFlow")
    abort "prompt recovery must target the iOS deep-link alert title" unless prompt_flow.fetch("when").fetch("visible") == "Open in .*"

    prompt_retry = prompt_flow.fetch("commands").fetch(0).fetch("retry")
    abort "prompt dismissal retry count must be bounded" unless prompt_retry.fetch("maxRetries") == 2

    prompt_commands = prompt_retry.fetch("commands")
    abort "prompt dismissal must tap Open" unless prompt_commands.fetch(0).fetch("tapOn").fetch("text") == "Open"
    prompt_wait = prompt_commands.fetch(1).fetch("extendedWaitUntil")
    abort "prompt dismissal must be verified" unless prompt_wait.fetch("notVisible") == "Open in .*"
    abort "prompt dismissal wait must stay short" unless prompt_wait.fetch("timeout") == 3000

    recovered_wait = prime_commands.fetch(1).fetch("extendedWaitUntil")
    abort "prime must clear a possibly presented alert before the required open" unless recovered_wait.fetch("notVisible") == "Open in .*"
    abort "prompt recovery wait must stay short" unless recovered_wait.fetch("timeout") == 3000

    required_open = prime_commands.fetch(2).fetch("openLink")
    abort "prime must require a post-recovery transactions deep link" unless required_open.fetch("link") == "budgie://transactions"
    abort "post-recovery deep link must fail closed" if required_open.key?("optional")

    post_open_prompt_wait = prime_commands.fetch(3).fetch("extendedWaitUntil")
    abort "prime must reject a prompt left by the required open" unless post_open_prompt_wait.fetch("notVisible") == "Open in .*"
    abort "post-open prompt wait must stay short" unless post_open_prompt_wait.fetch("timeout") == 3000

    destination_wait = prime_commands.fetch(4).fetch("extendedWaitUntil")
    abort "prime must verify the canonical transactions destination" unless destination_wait.fetch("visible").fetch("id") == "TransactionsPage.Container"
    abort "transactions destination wait must be bounded" unless destination_wait.fetch("timeout") == 10000
' "$WORKSPACE_DIR/flows/setup/prime-deep-links.flow.yaml"

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

run_quoted_path_case

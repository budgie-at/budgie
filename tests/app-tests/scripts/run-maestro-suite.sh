#!/bin/sh

CURRENT_BASH_NAME="$(basename "${BASH:-}")"

if [ -z "${BASH:-}" ] || [ "$CURRENT_BASH_NAME" = "sh" ]; then
    exec /bin/bash "$0" "$@"
fi

set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <app-id> [maestro args...]"
    exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$WORKSPACE_DIR"

APP_ID="$1"
shift
MAESTRO_ARGS=("$@")
OUTPUT_PATH=""

E2E_RUN_TOKEN="${E2E_RUN_TOKEN:-$(date +%s)}"
SIMULATOR_UDID="${SIMULATOR_UDID:-}"
RECURRING_EMPTY_DAY="${RECURRING_EMPTY_DAY:-}"
DATABASE_FIXTURE_SEEDED="false"
IOS_SIMULATOR_REBOOT_EVERY="${E2E_IOS_SIMULATOR_REBOOT_EVERY:-0}"
APP_DATA_CONTAINER="${APP_DATA_CONTAINER:-}"
FIRST_FLOW_PREPARED_PATH="${MAESTRO_FIRST_FLOW_PREPARED_PATH-}"
FIRST_FLOW_PREPARED_SIGNALED=false
PRIME_FLOW_PATH="${MAESTRO_PRIME_FLOW_PATH:-$WORKSPACE_DIR/flows/setup/prime-deep-links.flow.yaml}"

if [ -n "$APP_DATA_CONTAINER" ] && [ ! -d "$APP_DATA_CONTAINER" ]; then
    echo "App data container override is not a directory: $APP_DATA_CONTAINER" >&2
    exit 1
fi

if [ -n "$FIRST_FLOW_PREPARED_PATH" ]; then
    case "$FIRST_FLOW_PREPARED_PATH" in
        /*)
            ;;
        *)
            echo "MAESTRO_FIRST_FLOW_PREPARED_PATH must be absolute: $FIRST_FLOW_PREPARED_PATH" >&2
            exit 1
            ;;
    esac

    FIRST_FLOW_PREPARED_PARENT="$(dirname "$FIRST_FLOW_PREPARED_PATH")"

    if [ ! -d "$FIRST_FLOW_PREPARED_PARENT" ] || [ ! -w "$FIRST_FLOW_PREPARED_PARENT" ]; then
        echo "First-flow preparation marker parent must be a writable directory: $FIRST_FLOW_PREPARED_PARENT" >&2
        exit 1
    fi

    if [ -e "$FIRST_FLOW_PREPARED_PATH" ]; then
        echo "First-flow preparation marker already exists: $FIRST_FLOW_PREPARED_PATH" >&2
        exit 1
    fi
fi

compute_recurring_empty_day() {
    node <<'EOF'
const now = new Date();
const todayDay = now.getDate();
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
const upcomingDay = Math.min(lastDayOfMonth, todayDay + 5);
const candidateDays = [21, 22, 23, 24, 26, 27, 28];
const recurringEmptyDay =
    candidateDays.find(candidateDay => candidateDay <= lastDayOfMonth && candidateDay !== todayDay && candidateDay !== upcomingDay) ??
    (todayDay === 1 ? 2 : 1);

process.stdout.write(String(recurringEmptyDay));
EOF
}

capture_output_path() {
    local index

    for index in "${!MAESTRO_ARGS[@]}"; do
        if [ "${MAESTRO_ARGS[$index]}" = "--output" ] && [ "$((index + 1))" -lt "${#MAESTRO_ARGS[@]}" ]; then
            OUTPUT_PATH="${MAESTRO_ARGS[$((index + 1))]}"
        fi
    done
}

detect_booted_simulator_udid() {
    if [ -n "$SIMULATOR_UDID" ]; then
        printf '%s\n' "$SIMULATOR_UDID"
        return 0
    fi

    BOOTED_UDIDS="$(
        xcrun simctl list devices booted 2>/dev/null |
            sed -n 's/.*(\([A-F0-9-]\{36\}\)) (Booted).*/\1/p'
    )"
    BOOTED_COUNT="$(printf '%s\n' "$BOOTED_UDIDS" | sed '/^$/d' | wc -l | tr -d ' ')"

    if [ "$BOOTED_COUNT" -ne 1 ]; then
        return 1
    fi

    printf '%s\n' "$BOOTED_UDIDS" | sed -n '1p'
}

compute_csv_fixtures_uri() {
    local udid="$1"
    local app_data_container

    if [ -z "$udid" ]; then
        return 1
    fi

    app_data_container="$(resolve_app_data_container "$udid" || true)"

    if [ -z "$app_data_container" ] || [ ! -d "$app_data_container" ]; then
        return 1
    fi

    printf 'file://%s/Documents/E2ECsvFixtures' "$app_data_container"
}

compute_db_fixtures_uri() {
    local udid="$1"
    local app_data_container

    if [ -z "$udid" ]; then
        return 1
    fi

    app_data_container="$(resolve_app_data_container "$udid" || true)"

    if [ -z "$app_data_container" ] || [ ! -d "$app_data_container" ]; then
        return 1
    fi

    printf 'file://%s/Documents/E2EFixtures' "$app_data_container"
}

resolve_app_data_container() {
    local udid="$1"

    if [ -n "$APP_DATA_CONTAINER" ]; then
        if [ ! -d "$APP_DATA_CONTAINER" ]; then
            return 1
        fi

        printf '%s\n' "$APP_DATA_CONTAINER"
        return 0
    fi

    xcrun simctl get_app_container "$udid" "$APP_ID" data 2>/dev/null || true
}

resolve_flow_file_path() {
    local flow_path="$1"
    local nested_flow_path="$2"

    if [[ "$nested_flow_path" = /* ]]; then
        printf '%s\n' "$nested_flow_path"
        return 0
    fi

    printf '%s/%s\n' "$(dirname "$flow_path")" "$nested_flow_path"
}

extract_database_fixture_name() {
    local flow_path="$1"
    local depth="${2:-0}"
    local fixture_name
    local nested_flow_path
    local nested_fixture_name

    fixture_name="$(sed -n "s/^[[:space:]]*FIXTURE_ROW_ID_MATCH:[[:space:]]*['\"]\\([^'\"]*\\.db\\).*['\"].*/\\1/p" "$flow_path" | head -n 1)"

    if [ -n "$fixture_name" ]; then
        printf '%s\n' "$fixture_name"
        return 0
    fi

    if [ "$depth" -ge 3 ]; then
        return 1
    fi

    while IFS= read -r nested_flow_path; do
        nested_flow_path="$(resolve_flow_file_path "$flow_path" "$nested_flow_path")"

        if [ ! -f "$nested_flow_path" ]; then
            continue
        fi

        nested_fixture_name="$(extract_database_fixture_name "$nested_flow_path" "$((depth + 1))" || true)"

        if [ -n "$nested_fixture_name" ]; then
            printf '%s\n' "$nested_fixture_name"
            return 0
        fi
    done < <(
        awk '/^[[:space:]]*file:[[:space:]]*/ {
            value = $0;
            sub(/^[[:space:]]*file:[[:space:]]*/, "", value);
            gsub(/'\''|"/, "", value);
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", value);
            if (value ~ /\.flow\.yaml$/) {
                print value;
            }
        }' "$flow_path"
    )

    return 1
}

seed_ios_database_fixture_if_needed() {
    local flow_path="$1"
    local fixture_name
    local app_data_container
    local fixture_path
    local sqlite_dir

    DATABASE_FIXTURE_SEEDED="false"

    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    fixture_name="$(extract_database_fixture_name "$flow_path" || true)"

    if [ -z "$fixture_name" ]; then
        return 0
    fi

    app_data_container="$(resolve_app_data_container "$DETECTED_SIMULATOR_UDID" || true)"

    if [ -z "$app_data_container" ] || [ ! -d "$app_data_container" ]; then
        return 0
    fi

    fixture_path="$app_data_container/Documents/E2EFixtures/$fixture_name"

    if [ ! -f "$fixture_path" ]; then
        echo "Database fixture not found: $fixture_path" >&2
        return 1
    fi

    sqlite_dir="$app_data_container/Documents/SQLite"

    xcrun simctl terminate "$DETECTED_SIMULATOR_UDID" "$APP_ID" >/dev/null 2>&1 || true
    xcrun simctl keychain "$DETECTED_SIMULATOR_UDID" reset >/dev/null 2>&1 || true
    mkdir -p "$sqlite_dir"
    rm -f "$sqlite_dir"/budgie.db*
    cp "$fixture_path" "$sqlite_dir/budgie.db"
    xcrun simctl launch "$DETECTED_SIMULATOR_UDID" "$APP_ID" >/dev/null

    DATABASE_FIXTURE_SEEDED="true"
    echo "Seeded active iOS database fixture $fixture_name"
}

refresh_ios_fixtures_if_needed() {
    DETECTED_SIMULATOR_UDID="$(detect_booted_simulator_udid || true)"

    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    APP_DATA_CONTAINER="$(resolve_app_data_container "$DETECTED_SIMULATOR_UDID" || true)"

    if [ -z "$APP_DATA_CONTAINER" ]; then
        return 0
    fi

    echo "Refreshing iOS fixtures for $APP_ID on $DETECTED_SIMULATOR_UDID"
    APP_DATA_CONTAINER="$APP_DATA_CONTAINER" \
        sh "$SCRIPT_DIR/setup-ios-e2e-fixtures.sh" "$DETECTED_SIMULATOR_UDID" "$APP_ID"
}

reboot_ios_simulator_if_needed() {
    local flow_index="$1"

    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    if [ "$IOS_SIMULATOR_REBOOT_EVERY" -le 0 ]; then
        return 0
    fi

    if [ "$flow_index" -le 1 ]; then
        return 0
    fi

    if [ "$(((flow_index - 1) % IOS_SIMULATOR_REBOOT_EVERY))" -ne 0 ]; then
        return 0
    fi

    echo "Rebooting iOS simulator before flow $flow_index"
    xcrun simctl shutdown "$DETECTED_SIMULATOR_UDID" >/dev/null 2>&1 || true
    xcrun simctl boot "$DETECTED_SIMULATOR_UDID" >/dev/null 2>&1 || true
    xcrun simctl bootstatus "$DETECTED_SIMULATOR_UDID" -b >/dev/null
}

build_maestro_args() {
    local flow_output_path="$1"
    local attempt_output_path="$2"
    local args=("${MAESTRO_ARGS[@]}")
    local index

    for index in "${!args[@]}"; do
        if [ "${args[$index]}" = "--output" ] && [ "$((index + 1))" -lt "${#args[@]}" ] && [ -n "$flow_output_path" ]; then
                args[$((index + 1))]="$flow_output_path"
        fi

        if [ "${args[$index]}" = "--debug-output" ] || [ "${args[$index]}" = "--test-output-dir" ]; then
            if [ "$((index + 1))" -lt "${#args[@]}" ] && [ -n "$attempt_output_path" ]; then
                args[$((index + 1))]="$attempt_output_path/${args[$index]#--}/$(basename "${args[$((index + 1))]}")"
                mkdir -p "${args[$((index + 1))]}"
            fi
        fi
    done

    printf '%s\0' "${args[@]}"
}

collect_flow_paths() {
    local arg
    local flow_path
    local flows_dir
    local filtered_args=()

    FLOW_PATHS=()

    for arg in "${MAESTRO_ARGS[@]}"; do
        case "$arg" in
            *.flow.yaml | *.yaml | *.yml)
                if [[ "$arg" = /* ]]; then
                    FLOW_PATHS+=("$arg")
                else
                    FLOW_PATHS+=("$WORKSPACE_DIR/$arg")
                fi
                ;;
            flows | flows/ | */flows | */flows/)
                flows_dir="${arg%/}"

                if [[ "$flows_dir" != /* ]]; then
                    flows_dir="$WORKSPACE_DIR/$flows_dir"
                fi

                for flow_path in "$flows_dir"/*.flow.yaml; do
                    if [ -e "$flow_path" ]; then
                        FLOW_PATHS+=("$flow_path")
                    fi
                done
                ;;
            *)
                filtered_args+=("$arg")
                ;;
        esac
    done

    MAESTRO_ARGS=("${filtered_args[@]}")

    if [ "${#FLOW_PATHS[@]}" -ne 0 ]; then
        return
    fi

    for flow_path in "$WORKSPACE_DIR"/flows/*.flow.yaml; do
        if [ -e "$flow_path" ]; then
            FLOW_PATHS+=("$flow_path")
        fi
    done
}

print_yaml_single_quoted_scalar() {
    local value="$1"

    value=${value//\'/\'\'}
    printf "'%s'" "$value"
}

create_prime_and_business_flow() {
    local business_flow_path="$1"
    local combined_flow_path="$2"
    local business_flow_name

    if [ ! -f "$PRIME_FLOW_PATH" ]; then
        return 1
    fi

    business_flow_name=$(basename "$business_flow_path")
    business_flow_name="${business_flow_name%.yaml}"

    {
        printf '%s\n' 'appId: ${APP_ID}'
        printf 'name: '
        print_yaml_single_quoted_scalar "$business_flow_name"
        printf '\n'
        printf '%s\n' '---' '- runFlow:'
        printf '      file: '
        print_yaml_single_quoted_scalar "$PRIME_FLOW_PATH"
        printf '\n'
        printf '%s\n' '- runFlow:'
        printf '      file: '
        print_yaml_single_quoted_scalar "$business_flow_path"
        printf '\n'
    } > "$combined_flow_path"
}

signal_first_flow_prepared() {
    if [ -z "$FIRST_FLOW_PREPARED_PATH" ] || [ "$FIRST_FLOW_PREPARED_SIGNALED" = true ]; then
        return 0
    fi

    mkdir "$FIRST_FLOW_PREPARED_PATH"
    FIRST_FLOW_PREPARED_SIGNALED=true
}

run_maestro_flow() {
    local flow_path="$1"
    local flow_output_path="$2"
    local attempt_output_path="$3"
    local include_prime="$4"
    local args=()
    local execution_flow_path="$flow_path"

    seed_ios_database_fixture_if_needed "$flow_path"

    if [ "$include_prime" = true ]; then
        execution_flow_path="$attempt_output_path/prime-and-business.flow.yaml"

        if ! create_prime_and_business_flow "$flow_path" "$execution_flow_path"; then
            echo "Required deep-link prime flow is missing: $PRIME_FLOW_PATH" >&2
            return 1
        fi
    fi

    while IFS= read -r -d '' arg; do
        args+=("$arg")
    done < <(build_maestro_args "$flow_output_path" "$attempt_output_path")

    signal_first_flow_prepared

    if [ -n "$DETECTED_SIMULATOR_UDID" ]; then
        maestro --device "$DETECTED_SIMULATOR_UDID" test "$execution_flow_path" \
            --config "$WORKSPACE_DIR/config.yaml" \
            -e APP_ID="$APP_ID" \
            -e E2E_RUN_TOKEN="$E2E_RUN_TOKEN" \
            -e RECURRING_EMPTY_DAY="$RECURRING_EMPTY_DAY" \
            -e E2E_CSV_FIXTURES_URI="$E2E_CSV_FIXTURES_URI" \
            -e E2E_DB_FIXTURES_URI="$E2E_DB_FIXTURES_URI" \
            -e DATABASE_FIXTURE_SEEDED="$DATABASE_FIXTURE_SEEDED" \
            "${args[@]}"
    else
        maestro test "$execution_flow_path" \
            --config "$WORKSPACE_DIR/config.yaml" \
            -e APP_ID="$APP_ID" \
            -e E2E_RUN_TOKEN="$E2E_RUN_TOKEN" \
            -e RECURRING_EMPTY_DAY="$RECURRING_EMPTY_DAY" \
            -e E2E_CSV_FIXTURES_URI="$E2E_CSV_FIXTURES_URI" \
            -e E2E_DB_FIXTURES_URI="$E2E_DB_FIXTURES_URI" \
            -e DATABASE_FIXTURE_SEEDED="$DATABASE_FIXTURE_SEEDED" \
            "${args[@]}"
    fi
}

is_ax_driver_failure() {
    local output_path="$1"

    grep -Eiq 'kAXErrorInvalidUIElement' "$output_path"
}

reset_ios_simulator_after_ax_driver_failure() {
    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    echo "Restarting iOS simulator after kAXErrorInvalidUIElement"
    xcrun simctl shutdown "$DETECTED_SIMULATOR_UDID" >/dev/null 2>&1 || true
    xcrun simctl boot "$DETECTED_SIMULATOR_UDID" >/dev/null 2>&1 || true
    xcrun simctl bootstatus "$DETECTED_SIMULATOR_UDID" -b >/dev/null
}

merge_reports() {
    local output_path="$1"
    shift

    if [ -z "$output_path" ] || [ "$#" -eq 0 ]; then
        return 0
    fi

    node - "$output_path" "$@" <<'EOF'
const fs = require('node:fs');
const [outputPath, ...reportPaths] = process.argv.slice(2);

const getAttribute = (attributes, name, fallback) => {
    const match = attributes.match(new RegExp(`${name}="([^"]*)"`));

    return match?.[1] ?? fallback;
};

let tests = 0;
let failures = 0;
let time = 0;
let device = '';
const testcases = [];

for (const reportPath of reportPaths) {
    const xml = fs.readFileSync(reportPath, 'utf8');
    const suiteMatch = xml.match(/<testsuite\b([^>]*)>([\s\S]*?)<\/testsuite>/);

    if (!suiteMatch) {
        continue;
    }

    const attributes = suiteMatch[1];
    const body = suiteMatch[2];

    tests += Number(getAttribute(attributes, 'tests', '0'));
    failures += Number(getAttribute(attributes, 'failures', '0'));
    time += Number(getAttribute(attributes, 'time', '0'));

    if (!device) {
        device = getAttribute(attributes, 'device', '');
    }

    const testcaseMatches = body.match(/<testcase\b[\s\S]*?<\/testcase>|<testcase\b[^>]*\/>/g) ?? [];

    testcases.push(...testcaseMatches);
}

const deviceAttribute = device ? ` device="${device}"` : '';
const body = testcases.map(testcase => `    ${testcase}`).join('\n');
const xml = `<?xml version='1.0' encoding='UTF-8'?>\n<testsuites>\n  <testsuite name="Test Suite"${deviceAttribute} tests="${tests}" failures="${failures}" time="${time.toFixed(1)}">\n${body}\n  </testsuite>\n</testsuites>\n`;

fs.mkdirSync(require('node:path').dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, xml);
EOF
}

record_flow_timing() {
    local flow_index="$1"
    local flow_name="$2"
    local flow_status="$3"
    local attempt_count="$4"
    local started_at="$5"
    local duration_seconds

    if [ -z "$FLOW_TIMINGS_PATH" ]; then
        return 0
    fi

    duration_seconds="$(($(date +%s) - started_at))"

    printf '%s\t%s\t%s\t%s\t%s\n' "$flow_index" "$flow_name" "$flow_status" "$attempt_count" "$duration_seconds" >> "$FLOW_TIMINGS_PATH"
}

refresh_ios_fixtures_if_needed

if [ -z "$RECURRING_EMPTY_DAY" ]; then
    RECURRING_EMPTY_DAY="$(compute_recurring_empty_day)"
fi

DETECTED_SIMULATOR_UDID="${DETECTED_SIMULATOR_UDID:-$(detect_booted_simulator_udid || true)}"
E2E_CSV_FIXTURES_URI="$(compute_csv_fixtures_uri "$DETECTED_SIMULATOR_UDID" || true)"
E2E_DB_FIXTURES_URI="$(compute_db_fixtures_uri "$DETECTED_SIMULATOR_UDID" || true)"

if [ -z "$E2E_CSV_FIXTURES_URI" ]; then
    echo "Could not resolve E2E_CSV_FIXTURES_URI for $APP_ID; CSV-import flows will fail." >&2
fi

if [ -z "$E2E_DB_FIXTURES_URI" ]; then
    echo "Could not resolve E2E_DB_FIXTURES_URI for $APP_ID; database-import flows will fail." >&2
fi

collect_flow_paths
capture_output_path

echo "Running Maestro suite from $WORKSPACE_DIR"

REPORT_DIR=""
REPORTS=()
FLOW_TIMINGS_PATH=""
FLOW_INDEX=0
FLOW_TOTAL="${#FLOW_PATHS[@]}"

if [ -n "$OUTPUT_PATH" ]; then
    REPORT_DIR="$(dirname "$OUTPUT_PATH")/.maestro-flow-reports"
    FLOW_TIMINGS_PATH="$(dirname "$OUTPUT_PATH")/flow-timings.tsv"
    rm -rf "$REPORT_DIR"
    mkdir -p "$REPORT_DIR"
    printf 'index\tflow\tstatus\tattempts\tduration_seconds\n' > "$FLOW_TIMINGS_PATH"
fi

for FLOW_PATH in "${FLOW_PATHS[@]}"; do
    FLOW_INDEX=$((FLOW_INDEX + 1))
    FLOW_NAME="$(basename "$FLOW_PATH")"
    FLOW_OUTPUT_PATH=""
    FLOW_ARTIFACT_PATH=""
    FLOW_STATUS=0
    FLOW_STARTED_AT="$(date +%s)"
    INCLUDE_PRIME=false

    if [ "$FLOW_INDEX" -eq 1 ]; then
        INCLUDE_PRIME=true
    fi

    if [ -n "$OUTPUT_PATH" ]; then
        FLOW_OUTPUT_PATH="$REPORT_DIR/$FLOW_INDEX-$FLOW_NAME.xml"
    fi

    if [ -n "$OUTPUT_PATH" ]; then
        FLOW_ARTIFACT_PATH="$(dirname "$OUTPUT_PATH")/.maestro-flow-attempts/$FLOW_INDEX-$FLOW_NAME"
    else
        FLOW_ARTIFACT_PATH="$WORKSPACE_DIR/.maestro-flow-attempts/$FLOW_INDEX-$FLOW_NAME"
    fi

    mkdir -p "$FLOW_ARTIFACT_PATH/attempt-1"

    reboot_ios_simulator_if_needed "$FLOW_INDEX"

    echo "Running Maestro flow $FLOW_INDEX/$FLOW_TOTAL: $FLOW_NAME"

    if run_maestro_flow "$FLOW_PATH" "$FLOW_OUTPUT_PATH" "$FLOW_ARTIFACT_PATH/attempt-1" "$INCLUDE_PRIME" > "$FLOW_ARTIFACT_PATH/attempt-1/maestro-console.log" 2>&1; then
        cat "$FLOW_ARTIFACT_PATH/attempt-1/maestro-console.log"
        record_flow_timing "$FLOW_INDEX" "$FLOW_NAME" success 1 "$FLOW_STARTED_AT"
        echo "Completed Maestro flow $FLOW_INDEX/$FLOW_TOTAL: $FLOW_NAME"

        if [ -n "$FLOW_OUTPUT_PATH" ] && [ -f "$FLOW_OUTPUT_PATH" ]; then
            REPORTS+=("$FLOW_OUTPUT_PATH")
            merge_reports "$OUTPUT_PATH" "${REPORTS[@]}"
        fi
    else
        FLOW_STATUS=$?
        cat "$FLOW_ARTIFACT_PATH/attempt-1/maestro-console.log"

        if is_ax_driver_failure "$FLOW_ARTIFACT_PATH/attempt-1/maestro-console.log"; then
            reset_ios_simulator_after_ax_driver_failure
            mkdir -p "$FLOW_ARTIFACT_PATH/attempt-2"

            if run_maestro_flow "$FLOW_PATH" "$FLOW_OUTPUT_PATH" "$FLOW_ARTIFACT_PATH/attempt-2" "$INCLUDE_PRIME" > "$FLOW_ARTIFACT_PATH/attempt-2/maestro-console.log" 2>&1; then
                cat "$FLOW_ARTIFACT_PATH/attempt-2/maestro-console.log"
                record_flow_timing "$FLOW_INDEX" "$FLOW_NAME" success 2 "$FLOW_STARTED_AT"
                echo "Completed Maestro flow $FLOW_INDEX/$FLOW_TOTAL after AX driver retry: $FLOW_NAME"

                if [ -n "$FLOW_OUTPUT_PATH" ] && [ -f "$FLOW_OUTPUT_PATH" ]; then
                    REPORTS+=("$FLOW_OUTPUT_PATH")
                    merge_reports "$OUTPUT_PATH" "${REPORTS[@]}"
                fi

                continue
            fi

            FLOW_STATUS=$?
            cat "$FLOW_ARTIFACT_PATH/attempt-2/maestro-console.log"
            record_flow_timing "$FLOW_INDEX" "$FLOW_NAME" failure 2 "$FLOW_STARTED_AT"
        else
            record_flow_timing "$FLOW_INDEX" "$FLOW_NAME" failure 1 "$FLOW_STARTED_AT"
        fi

        if [ -n "$FLOW_OUTPUT_PATH" ] && [ -f "$FLOW_OUTPUT_PATH" ]; then
            REPORTS+=("$FLOW_OUTPUT_PATH")
            merge_reports "$OUTPUT_PATH" "${REPORTS[@]}"
        fi

        exit "$FLOW_STATUS"
    fi
done

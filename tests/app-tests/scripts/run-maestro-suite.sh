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
    UDID="$1"

    if [ -z "$UDID" ]; then
        return 1
    fi

    APP_DATA_CONTAINER="$(
        xcrun simctl get_app_container "$UDID" "$APP_ID" data 2>/dev/null || true
    )"

    if [ -z "$APP_DATA_CONTAINER" ] || [ ! -d "$APP_DATA_CONTAINER" ]; then
        return 1
    fi

    printf 'file://%s/Documents/E2ECsvFixtures' "$APP_DATA_CONTAINER"
}

compute_db_fixtures_uri() {
    UDID="$1"

    if [ -z "$UDID" ]; then
        return 1
    fi

    APP_DATA_CONTAINER="$(
        xcrun simctl get_app_container "$UDID" "$APP_ID" data 2>/dev/null || true
    )"

    if [ -z "$APP_DATA_CONTAINER" ] || [ ! -d "$APP_DATA_CONTAINER" ]; then
        return 1
    fi

    printf 'file://%s/Documents/E2EFixtures' "$APP_DATA_CONTAINER"
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

    app_data_container="$(
        xcrun simctl get_app_container "$DETECTED_SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true
    )"

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
    sleep 3

    DATABASE_FIXTURE_SEEDED="true"
    echo "Seeded active iOS database fixture $fixture_name"
}

refresh_ios_fixtures_if_needed() {
    DETECTED_SIMULATOR_UDID="$(detect_booted_simulator_udid || true)"

    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    APP_DATA_CONTAINER="$(
        xcrun simctl get_app_container "$DETECTED_SIMULATOR_UDID" "$APP_ID" data 2>/dev/null || true
    )"

    if [ -z "$APP_DATA_CONTAINER" ]; then
        return 0
    fi

    echo "Refreshing iOS fixtures for $APP_ID on $DETECTED_SIMULATOR_UDID"
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
    local args=("${MAESTRO_ARGS[@]}")
    local index

    if [ -n "$flow_output_path" ]; then
        for index in "${!args[@]}"; do
            if [ "${args[$index]}" = "--output" ] && [ "$((index + 1))" -lt "${#args[@]}" ]; then
                args[$((index + 1))]="$flow_output_path"
            fi
        done
    fi

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

run_maestro_flow() {
    local flow_path="$1"
    local flow_output_path="$2"
    local args=()

    seed_ios_database_fixture_if_needed "$flow_path"

    while IFS= read -r -d '' arg; do
        args+=("$arg")
    done < <(build_maestro_args "$flow_output_path")

    if [ -n "$DETECTED_SIMULATOR_UDID" ]; then
        maestro test "$flow_path" \
            --config "$WORKSPACE_DIR/config.yaml" \
            --udid "$DETECTED_SIMULATOR_UDID" \
            -e APP_ID="$APP_ID" \
            -e E2E_RUN_TOKEN="$E2E_RUN_TOKEN" \
            -e RECURRING_EMPTY_DAY="$RECURRING_EMPTY_DAY" \
            -e E2E_CSV_FIXTURES_URI="$E2E_CSV_FIXTURES_URI" \
            -e E2E_DB_FIXTURES_URI="$E2E_DB_FIXTURES_URI" \
            -e DATABASE_FIXTURE_SEEDED="$DATABASE_FIXTURE_SEEDED" \
            "${args[@]}"
    else
        maestro test "$flow_path" \
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
FLOW_INDEX=0
FLOW_TOTAL="${#FLOW_PATHS[@]}"

if [ -n "$OUTPUT_PATH" ]; then
    REPORT_DIR="$(dirname "$OUTPUT_PATH")/.maestro-flow-reports"
    rm -rf "$REPORT_DIR"
    mkdir -p "$REPORT_DIR"
fi

for FLOW_PATH in "${FLOW_PATHS[@]}"; do
    FLOW_INDEX=$((FLOW_INDEX + 1))
    FLOW_NAME="$(basename "$FLOW_PATH")"
    FLOW_OUTPUT_PATH=""

    if [ -n "$OUTPUT_PATH" ]; then
        FLOW_OUTPUT_PATH="$REPORT_DIR/$FLOW_INDEX-$FLOW_NAME.xml"
    fi

    reboot_ios_simulator_if_needed "$FLOW_INDEX"

    echo "Running Maestro flow $FLOW_INDEX/$FLOW_TOTAL: $FLOW_NAME"

    if run_maestro_flow "$FLOW_PATH" "$FLOW_OUTPUT_PATH"; then
        echo "Completed Maestro flow $FLOW_INDEX/$FLOW_TOTAL: $FLOW_NAME"

        if [ -n "$FLOW_OUTPUT_PATH" ] && [ -f "$FLOW_OUTPUT_PATH" ]; then
            REPORTS+=("$FLOW_OUTPUT_PATH")
            merge_reports "$OUTPUT_PATH" "${REPORTS[@]}"
        fi
    else
        FLOW_STATUS=$?

        if [ -n "$FLOW_OUTPUT_PATH" ] && [ -f "$FLOW_OUTPUT_PATH" ]; then
            REPORTS+=("$FLOW_OUTPUT_PATH")
            merge_reports "$OUTPUT_PATH" "${REPORTS[@]}"
        fi

        exit "$FLOW_STATUS"
    fi
done

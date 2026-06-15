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

APP_ID="$1"
shift
MAESTRO_ARGS=("$@")
OUTPUT_PATH=""

E2E_RUN_TOKEN="${E2E_RUN_TOKEN:-$(date +%s)}"
SIMULATOR_UDID="${SIMULATOR_UDID:-}"
RECURRING_EMPTY_DAY="${RECURRING_EMPTY_DAY:-}"

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

run_maestro_flow() {
    local flow_path="$1"
    local flow_output_path="$2"
    local args=()

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
            "${args[@]}"
    else
        maestro test "$flow_path" \
            --config "$WORKSPACE_DIR/config.yaml" \
            -e APP_ID="$APP_ID" \
            -e E2E_RUN_TOKEN="$E2E_RUN_TOKEN" \
            -e RECURRING_EMPTY_DAY="$RECURRING_EMPTY_DAY" \
            -e E2E_CSV_FIXTURES_URI="$E2E_CSV_FIXTURES_URI" \
            -e E2E_DB_FIXTURES_URI="$E2E_DB_FIXTURES_URI" \
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

capture_output_path

echo "Running Maestro suite from $WORKSPACE_DIR"

REPORT_DIR=""
REPORTS=()
FLOW_INDEX=0

if [ -n "$OUTPUT_PATH" ]; then
    REPORT_DIR="$(dirname "$OUTPUT_PATH")/.maestro-flow-reports"
    rm -rf "$REPORT_DIR"
    mkdir -p "$REPORT_DIR"
fi

for FLOW_PATH in "$WORKSPACE_DIR"/flows/*.flow.yaml; do
    FLOW_INDEX=$((FLOW_INDEX + 1))
    FLOW_NAME="$(basename "$FLOW_PATH")"
    FLOW_OUTPUT_PATH=""

    if [ -n "$OUTPUT_PATH" ]; then
        FLOW_OUTPUT_PATH="$REPORT_DIR/$FLOW_INDEX-$FLOW_NAME.xml"
    fi

    if run_maestro_flow "$FLOW_PATH" "$FLOW_OUTPUT_PATH"; then
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

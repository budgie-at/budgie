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

. "$SCRIPT_DIR/driver-failure-pattern.sh"
. "$SCRIPT_DIR/mobile-ci-slim-simulator.sh"
. "$SCRIPT_DIR/flow-fixture-lookup.sh"

APP_ID="$1"
shift
MAESTRO_ARGS=("$@")
OUTPUT_PATH=""

E2E_RUN_TOKEN="${E2E_RUN_TOKEN:-$(date +%s)}"
SIMULATOR_UDID="${SIMULATOR_UDID:-}"
DATABASE_FIXTURE_SEEDED="false"
APP_DATA_CONTAINER="${APP_DATA_CONTAINER:-}"
APP_DATA_CONTAINER_OVERRIDE="$APP_DATA_CONTAINER"
PRIME_FLOW_PATH="${MAESTRO_PRIME_FLOW_PATH:-$WORKSPACE_DIR/flows/setup/prime-deep-links.flow.yaml}"

if [ -n "$APP_DATA_CONTAINER_OVERRIDE" ] && [ ! -d "$APP_DATA_CONTAINER_OVERRIDE" ]; then
    echo "App data container override is not a directory: $APP_DATA_CONTAINER_OVERRIDE" >&2
    exit 1
fi

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

resolve_app_data_container() {
    local udid="$1"

    if [ -n "$APP_DATA_CONTAINER_OVERRIDE" ]; then
        printf '%s\n' "$APP_DATA_CONTAINER_OVERRIDE"
        return 0
    fi

    xcrun simctl get_app_container "$udid" "$APP_ID" data 2>/dev/null || true
}

collect_required_fixtures() {
    local flow_path
    local fixture_name
    local required_fixtures=()

    for flow_path in "${FLOW_PATHS[@]}"; do
        while IFS= read -r fixture_name; do
            if [ -z "$fixture_name" ]; then
                continue
            fi

            if [ "${#required_fixtures[@]}" -eq 0 ]; then
                required_fixtures+=("$fixture_name")
                continue
            fi

            case " ${required_fixtures[*]} " in
                *" $fixture_name "*) ;;
                *) required_fixtures+=("$fixture_name") ;;
            esac
        done < <(collect_flow_required_fixtures "$flow_path")
    done

    if [ "${#required_fixtures[@]}" -eq 0 ]; then
        return 0
    fi

    printf '%s\n' "${required_fixtures[@]}"
}

collect_flow_required_fixtures() {
    local flow_path="$1"

    node - "$flow_path" <<'EOF'
const fs = require('node:fs');
const path = require('node:path');

const rootFlowPath = process.argv[2];
const visited = new Set();
const fixtures = new Set();

const normalizeFileFixture = value => {
    const trimmedValue = value.trim();

    if (trimmedValue.startsWith('${')) {
        return null;
    }

    const optionalExtensionMatch = trimmedValue.match(/^(.+?)\s*\(,\s*(csv|pdf|xlsx)\)\?$/);

    if (optionalExtensionMatch) {
        return `${optionalExtensionMatch[1]}.${optionalExtensionMatch[2]}`;
    }

    const commaExtensionMatch = trimmedValue.match(/^(.+?),\s*(csv|pdf|xlsx)$/);

    if (commaExtensionMatch) {
        return `${commaExtensionMatch[1]}.${commaExtensionMatch[2]}`;
    }

    if (/\.(csv|pdf|xlsx)$/.test(trimmedValue)) {
        return path.basename(trimmedValue);
    }

    return null;
};

const collectFromFlow = (flowPath, depth) => {
    const absoluteFlowPath = path.resolve(flowPath);

    if (visited.has(absoluteFlowPath) || depth > 3 || !fs.existsSync(absoluteFlowPath)) {
        return;
    }

    visited.add(absoluteFlowPath);

    const source = fs.readFileSync(absoluteFlowPath, 'utf8');
    const databaseFixtureMatch = source.match(/^\s*FIXTURE_ROW_ID_MATCH:\s*['"]([^'"]*\.db)[^'"]*['"]/m);

    if (databaseFixtureMatch) {
        fixtures.add(databaseFixtureMatch[1]);
    }

    for (const match of source.matchAll(/^\s*(?:FILE_ROW_ID_MATCH|PDF_ROW_ID_MATCH|XLSX_ROW_ID_MATCH):\s*['"]([^'"]+)['"]/gm)) {
        const fixture = normalizeFileFixture(match[1]);

        if (fixture) {
            fixtures.add(fixture);
        }
    }

    for (const match of source.matchAll(/^\s*CSV_DISPLAY_NAME:\s*['"]?([^'"\s]+)['"]?/gm)) {
        if (!match[1].startsWith('${')) {
            fixtures.add(`${match[1]}.csv`);
        }
    }

    for (const match of source.matchAll(/^\s*file:\s*['"]?([^'"\s]+\.flow\.yaml)['"]?/gm)) {
        collectFromFlow(path.resolve(path.dirname(absoluteFlowPath), match[1]), depth + 1);
    }
};

collectFromFlow(rootFlowPath, 0);

for (const fixture of fixtures) {
    process.stdout.write(`${fixture}\n`);
}
EOF
}

seed_ios_database_fixture_if_needed() {
    local flow_path="$1"
    local fixture_name
    local app_data_container

    DATABASE_FIXTURE_SEEDED="false"

    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    fixture_name="$(extract_database_fixture_name "$flow_path" || true)"
    app_data_container="$(resolve_app_data_container "$DETECTED_SIMULATOR_UDID" || true)"

    if [ -z "$fixture_name" ] || [ ! -d "$app_data_container" ]; then
        return 0
    fi

    install_database_fixture "$DETECTED_SIMULATOR_UDID" "$APP_ID" "$app_data_container" "$fixture_name"
    DATABASE_FIXTURE_SEEDED="true"
    echo "Seeded active iOS database fixture $fixture_name"
}

refresh_ios_fixture_state() {
    local required_fixtures=()
    local required_fixture
    local app_data_container

    DETECTED_SIMULATOR_UDID="$(detect_booted_simulator_udid || true)"
    E2E_CSV_FIXTURES_URI=""
    E2E_FIXTURES_URI=""

    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    app_data_container="$(resolve_app_data_container "$DETECTED_SIMULATOR_UDID" || true)"

    if [ -z "$app_data_container" ]; then
        return 0
    fi

    while IFS= read -r required_fixture; do
        if [ -n "$required_fixture" ]; then
            required_fixtures+=("$required_fixture")
        fi
    done < <(collect_required_fixtures)

    echo "Refreshing iOS fixtures for $APP_ID on $DETECTED_SIMULATOR_UDID with ${#required_fixtures[@]} fixtures"
    APP_DATA_CONTAINER="$app_data_container" \
        sh "$SCRIPT_DIR/setup-ios-e2e-fixtures.sh" "$DETECTED_SIMULATOR_UDID" "$APP_ID" ${required_fixtures[@]+"${required_fixtures[@]}"}

    if [ -d "$app_data_container" ]; then
        E2E_CSV_FIXTURES_URI="file://$app_data_container/Documents/E2ECsvFixtures"
        E2E_FIXTURES_URI="file://$app_data_container/Documents/E2EFixtures"
    fi
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

run_maestro_flow() {
    local flow_path="$1"
    local flow_output_path="$2"
    local attempt_output_path="$3"
    local include_prime="$4"
    local args=()
    local device_args=()
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

    if [ -n "$DETECTED_SIMULATOR_UDID" ]; then
        device_args=(--device "$DETECTED_SIMULATOR_UDID")
    fi

    maestro ${device_args[@]+"${device_args[@]}"} test "$execution_flow_path" \
        --config "$WORKSPACE_DIR/config.yaml" \
        -e APP_ID="$APP_ID" \
        -e E2E_RUN_TOKEN="$E2E_RUN_TOKEN" \
        -e E2E_CSV_FIXTURES_URI="$E2E_CSV_FIXTURES_URI" \
        -e E2E_FIXTURES_URI="$E2E_FIXTURES_URI" \
        -e DATABASE_FIXTURE_SEEDED="$DATABASE_FIXTURE_SEEDED" \
        "${args[@]}"
}

is_ax_driver_failure() {
    local console_output_path="$1"
    local attempt_output_path="$2"

    grep -Eiq "$MAESTRO_RECOVERABLE_FAILURE_PATTERN" "$console_output_path" && return 0

    if [ -d "$attempt_output_path" ]; then
        grep -REiq "$MAESTRO_RECOVERABLE_FAILURE_PATTERN" "$attempt_output_path"
        return
    fi

    return 1
}

reset_ios_simulator_after_ax_driver_failure() {
    if [ -z "$DETECTED_SIMULATOR_UDID" ]; then
        return 0
    fi

    echo "Restarting iOS simulator and driver after a recoverable driver failure"
    sh "$SCRIPT_DIR/recycle-ios-driver.sh" "$DETECTED_SIMULATOR_UDID" || true
    xcrun simctl shutdown "$DETECTED_SIMULATOR_UDID" >/dev/null 2>&1 || true
    xcrun simctl boot "$DETECTED_SIMULATOR_UDID" >/dev/null 2>&1 || true
    xcrun simctl bootstatus "$DETECTED_SIMULATOR_UDID" -b >/dev/null
    slim_simulator "$DETECTED_SIMULATOR_UDID"
    refresh_ios_fixture_state
}

run_flow_with_driver_retries() {
    local attempt
    local attempt_path

    for attempt in 1 2 3; do
        attempt_path="$FLOW_ARTIFACT_PATH/attempt-$attempt"
        mkdir -p "$attempt_path"

        FLOW_STATUS=0
        run_maestro_flow "$FLOW_PATH" "$FLOW_OUTPUT_PATH" "$attempt_path" "$INCLUDE_PRIME" > "$attempt_path/maestro-console.log" 2>&1 || FLOW_STATUS=$?
        cat "$attempt_path/maestro-console.log"

        if [ "$FLOW_STATUS" -eq 0 ]; then
            return 0
        fi

        if [ "$attempt" -eq 3 ] || ! is_ax_driver_failure "$attempt_path/maestro-console.log" "$attempt_path"; then
            return 1
        fi

        reset_ios_simulator_after_ax_driver_failure
    done
}

collect_flow_paths
refresh_ios_fixture_state

DETECTED_SIMULATOR_UDID="${DETECTED_SIMULATOR_UDID:-$(detect_booted_simulator_udid || true)}"

if [ -n "$DETECTED_SIMULATOR_UDID" ]; then
    slim_simulator "$DETECTED_SIMULATOR_UDID"
fi

if [ -z "$E2E_CSV_FIXTURES_URI" ]; then
    echo "Could not resolve E2E_CSV_FIXTURES_URI for $APP_ID; CSV-import flows will fail." >&2
fi

capture_output_path

echo "Running Maestro suite from $WORKSPACE_DIR"

REPORT_DIR=""
REPORTS=()
FLOW_INDEX=0
FLOW_TOTAL="${#FLOW_PATHS[@]}"
SUITE_STATUS=0
FAILED_FLOW_NAMES=""

if [ -n "$OUTPUT_PATH" ]; then
    REPORT_DIR="$(dirname "$OUTPUT_PATH")/.maestro-flow-reports"
    rm -rf "$REPORT_DIR"
    mkdir -p "$REPORT_DIR"
fi

for FLOW_PATH in "${FLOW_PATHS[@]}"; do
    FLOW_INDEX=$((FLOW_INDEX + 1))
    FLOW_NAME="$(basename "$FLOW_PATH")"
    FLOW_OUTPUT_PATH=""
    FLOW_STATUS=0
    INCLUDE_PRIME=false

    if [ "$FLOW_INDEX" -eq 1 ]; then
        INCLUDE_PRIME=true
    fi

    if [ -n "$OUTPUT_PATH" ]; then
        FLOW_OUTPUT_PATH="$REPORT_DIR/$FLOW_INDEX-$FLOW_NAME.xml"
        FLOW_ARTIFACT_PATH="$(dirname "$OUTPUT_PATH")/.maestro-flow-attempts/$FLOW_INDEX-$FLOW_NAME"
    else
        FLOW_ARTIFACT_PATH="$WORKSPACE_DIR/.maestro-flow-attempts/$FLOW_INDEX-$FLOW_NAME"
    fi

    echo "Running Maestro flow $FLOW_INDEX/$FLOW_TOTAL: $FLOW_NAME"

    if run_flow_with_driver_retries; then
        echo "Completed Maestro flow $FLOW_INDEX/$FLOW_TOTAL: $FLOW_NAME"
    else
        SUITE_STATUS="$FLOW_STATUS"
        FAILED_FLOW_NAMES="${FAILED_FLOW_NAMES}${FAILED_FLOW_NAMES:+, }${FLOW_NAME}"
        echo "Flow failed, continuing with remaining flows: $FLOW_NAME ($FLOW_INDEX/$FLOW_TOTAL)"
    fi

    if [ -n "$FLOW_OUTPUT_PATH" ] && [ -f "$FLOW_OUTPUT_PATH" ]; then
        REPORTS+=("$FLOW_OUTPUT_PATH")
        merge_reports "$OUTPUT_PATH" "${REPORTS[@]}"
    fi
done

if [ "$SUITE_STATUS" -ne 0 ]; then
    echo "Maestro suite finished with failures: $FAILED_FLOW_NAMES"
    exit "$SUITE_STATUS"
fi

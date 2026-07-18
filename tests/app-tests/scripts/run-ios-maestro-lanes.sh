#!/bin/bash
set -euo pipefail

if [ "$#" -ne 5 ]; then
    echo "Usage: $0 <app-id> <lane-1-udid> <lane-1-shard> <lane-2-udid> <lane-2-shard>"
    exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
APP_ID="$1"
LANE_1_UDID="$2"
LANE_1_SHARD="$3"
LANE_2_UDID="$4"
LANE_2_SHARD="$5"
ARTIFACT_ROOT="${MAESTRO_ARTIFACT_ROOT:-$WORKSPACE_DIR/artifacts/maestro}"
MAESTRO_SUITE_RUNNER="${MAESTRO_SUITE_RUNNER:-$SCRIPT_DIR/run-maestro-suite.sh}"
RUN_TOKEN="${E2E_RUN_TOKEN:-$(date +%s)}"
LANE_START_STAGGER_SECONDS="${MAESTRO_LANE_START_STAGGER_SECONDS-0}"
LANE_2_PREPARE_SCRIPT="${MAESTRO_LANE_2_PREPARE_SCRIPT-}"
LANE_2_APP_PATH="${MAESTRO_LANE_2_APP_PATH-}"
UDID_PATTERN='^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$'

case "$LANE_START_STAGGER_SECONDS" in
    '' | *[!0-9]*)
        echo "MAESTRO_LANE_START_STAGGER_SECONDS must be a nonnegative integer; got: $LANE_START_STAGGER_SECONDS" >&2
        exit 1
        ;;
esac

if [ -n "$LANE_2_PREPARE_SCRIPT" ] || [ -n "$LANE_2_APP_PATH" ]; then
    if [ ! -f "$LANE_2_PREPARE_SCRIPT" ] || [ ! -r "$LANE_2_PREPARE_SCRIPT" ]; then
        echo "MAESTRO_LANE_2_PREPARE_SCRIPT must be a readable file: $LANE_2_PREPARE_SCRIPT" >&2
        exit 1
    fi

    case "$LANE_2_APP_PATH" in
        *.app)
            ;;
        *)
            echo "MAESTRO_LANE_2_APP_PATH must be a readable .app bundle directory: $LANE_2_APP_PATH" >&2
            exit 1
            ;;
    esac

    if [ ! -d "$LANE_2_APP_PATH" ] || [ ! -r "$LANE_2_APP_PATH" ]; then
        echo "MAESTRO_LANE_2_APP_PATH must be a readable .app bundle directory: $LANE_2_APP_PATH" >&2
        exit 1
    fi
fi

if [[ ! "$LANE_1_UDID" =~ $UDID_PATTERN ]] || \
    [[ ! "$LANE_2_UDID" =~ $UDID_PATTERN ]] || \
    [ "$LANE_1_UDID" = "$LANE_2_UDID" ]; then
    echo "Two distinct simulator UDIDs are required."
    exit 1
fi

run_lane() {
    local lane_number="$1"
    local simulator_udid="$2"
    local shard_number="$3"
    local lane_artifact_dir="$ARTIFACT_ROOT/lane-$lane_number-shard-$shard_number"
    local shard_file="$WORKSPACE_DIR/shards/shard-$shard_number.txt"
    local flows=()
    local flow_name

    if [ ! -f "$shard_file" ]; then
        echo "Shard manifest not found: $shard_file" >&2
        return 1
    fi

    while IFS= read -r flow_name || [ -n "$flow_name" ]; do
        if [ -z "$flow_name" ]; then
            continue
        fi

        if [ ! -f "$WORKSPACE_DIR/flows/$flow_name" ]; then
            echo "Shard $shard_number references a missing flow: $flow_name" >&2
            return 1
        fi

        flows+=("flows/$flow_name")
    done < "$shard_file"

    if [ "${#flows[@]}" -eq 0 ]; then
        echo "Shard $shard_number contains no flows." >&2
        return 1
    fi

    mkdir -p "$lane_artifact_dir"
    printf 'Lane %s uses simulator %s for shard %s:\n%s\n' \
        "$lane_number" "$simulator_udid" "$shard_number" "${flows[*]}"

    SIMULATOR_UDID="$simulator_udid" \
        E2E_RUN_TOKEN="$RUN_TOKEN-lane-$lane_number" \
        MAESTRO_CLI_NO_ANALYTICS=true \
        MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true \
        sh "$MAESTRO_SUITE_RUNNER" "$APP_ID" \
        --format junit \
        --output "$lane_artifact_dir/report.xml" \
        --debug-output "$lane_artifact_dir/debug" \
        --test-output-dir "$lane_artifact_dir/test-output" \
        "${flows[@]}" \
        2>&1 | tee "$lane_artifact_dir/maestro-console.log"
}

run_staggered_lane() {
    local lane_number="$1"
    local simulator_udid="$2"
    local shard_number="$3"

    if [ "$LANE_START_STAGGER_SECONDS" -gt 0 ]; then
        sleep "$LANE_START_STAGGER_SECONDS"
    fi

    if [ -n "$LANE_2_PREPARE_SCRIPT" ]; then
        sh "$LANE_2_PREPARE_SCRIPT" "$simulator_udid" "$LANE_2_APP_PATH"
    fi

    run_lane "$lane_number" "$simulator_udid" "$shard_number"
}

mkdir -p "$ARTIFACT_ROOT"

run_lane 1 "$LANE_1_UDID" "$LANE_1_SHARD" &
LANE_1_PID=$!
run_staggered_lane 2 "$LANE_2_UDID" "$LANE_2_SHARD" &
LANE_2_PID=$!

set +e
wait "$LANE_1_PID"
LANE_1_STATUS=$?
wait "$LANE_2_PID"
LANE_2_STATUS=$?
set -e

if [ "$LANE_1_STATUS" -ne 0 ]; then
    exit "$LANE_1_STATUS"
fi

exit "$LANE_2_STATUS"

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
LANE_1_PREPARE_TIMEOUT_SECONDS="${MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS-300}"
LANE_2_PREPARE_SCRIPT="${MAESTRO_LANE_2_PREPARE_SCRIPT-}"
LANE_2_APP_PATH="${MAESTRO_LANE_2_APP_PATH-}"
UDID_PATTERN='^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$'

case "$LANE_1_PREPARE_TIMEOUT_SECONDS" in
    '' | *[!0-9]* | 0)
        echo "MAESTRO_LANE_1_PREPARE_TIMEOUT_SECONDS must be a positive integer; got: $LANE_1_PREPARE_TIMEOUT_SECONDS" >&2
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
    local first_flow_prepared_path="${4:-}"
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
        MAESTRO_FIRST_FLOW_PREPARED_PATH="$first_flow_prepared_path" \
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

terminate_process_group() {
    local group_pid="$1"
    local attempt

    if [ -z "$group_pid" ]; then
        return 0
    fi

    kill -TERM -- "-$group_pid" 2>/dev/null || true

    for attempt in 1 2 3 4 5 6 7 8 9 10; do
        if ! kill -0 -- "-$group_pid" 2>/dev/null; then
            return 0
        fi
        sleep 0.05
    done

    kill -KILL -- "-$group_pid" 2>/dev/null || true
}

wait_for_lane_1_prepared() {
    local lane_1_pid="$1"
    local elapsed_seconds=0

    while true; do
        if [ -d "$LANE_CANCEL_PATH" ]; then
            echo "Lane coordinator was cancelled before lane 2 preparation." >&2
            return 130
        fi

        if [ -d "$LANE_1_PREPARED_PATH" ]; then
            return 0
        fi

        if ! kill -0 "$lane_1_pid" 2>/dev/null; then
            if [ -d "$LANE_CANCEL_PATH" ]; then
                echo "Lane coordinator was cancelled before lane 2 preparation." >&2
                return 130
            fi

            if [ -d "$LANE_1_PREPARED_PATH" ]; then
                return 0
            fi

            echo "Lane 1 exited before completing first-flow preparation." >&2
            return 1
        fi

        if [ "$elapsed_seconds" -ge "$LANE_1_PREPARE_TIMEOUT_SECONDS" ]; then
            if [ -d "$LANE_CANCEL_PATH" ]; then
                echo "Lane coordinator was cancelled before lane 2 preparation." >&2
                return 130
            fi

            if [ -d "$LANE_1_PREPARED_PATH" ]; then
                return 0
            fi

            echo "Timed out waiting $LANE_1_PREPARE_TIMEOUT_SECONDS seconds for lane 1 first-flow preparation." >&2
            return 124
        fi

        sleep 1
        elapsed_seconds=$((elapsed_seconds + 1))
    done
}

run_waiting_lane() {
    local lane_number="$1"
    local simulator_udid="$2"
    local shard_number="$3"
    local lane_1_pid="$4"
    local wait_status

    wait_for_lane_1_prepared "$lane_1_pid" || {
        wait_status=$?

        if [ "$wait_status" -eq 124 ]; then
            terminate_process_group "$lane_1_pid"
        fi

        return "$wait_status"
    }

    if [ -d "$LANE_CANCEL_PATH" ]; then
        echo "Lane coordinator was cancelled before lane 2 preparation." >&2
        return 130
    fi

    if [ -n "$LANE_2_PREPARE_SCRIPT" ]; then
        sh "$LANE_2_PREPARE_SCRIPT" "$simulator_udid" "$LANE_2_APP_PATH"
    fi

    run_lane "$lane_number" "$simulator_udid" "$shard_number"
}

cancel_lane_jobs() {
    local signal_status="$1"

    trap - INT TERM
    mkdir "$LANE_CANCEL_PATH" 2>/dev/null || true

    terminate_process_group "$LANE_1_PID"
    terminate_process_group "$LANE_2_PID"

    if [ -n "$LANE_1_PID" ]; then
        wait "$LANE_1_PID" 2>/dev/null || true
    fi
    if [ -n "$LANE_2_PID" ]; then
        wait "$LANE_2_PID" 2>/dev/null || true
    fi

    exit "$signal_status"
}

mkdir -p "$ARTIFACT_ROOT"
BARRIER_DIR="$(mktemp -d "$ARTIFACT_ROOT/.lane-coordination.XXXXXX")"
BARRIER_DIR="$(CDPATH= cd -- "$BARRIER_DIR" && pwd)"
LANE_1_PREPARED_PATH="$BARRIER_DIR/lane-1-first-flow-prepared"
LANE_CANCEL_PATH="$BARRIER_DIR/cancelled"
LANE_1_PID=""
LANE_2_PID=""

trap 'cancel_lane_jobs 130' INT
trap 'cancel_lane_jobs 143' TERM

set -m

run_lane 1 "$LANE_1_UDID" "$LANE_1_SHARD" "$LANE_1_PREPARED_PATH" &
LANE_1_PID=$!
run_waiting_lane 2 "$LANE_2_UDID" "$LANE_2_SHARD" "$LANE_1_PID" &
LANE_2_PID=$!
printf '%s\n' "$LANE_1_PID" > "$BARRIER_DIR/lane-1.pid"
printf '%s\n' "$LANE_2_PID" > "$BARRIER_DIR/lane-2.pid"

set +e
wait "$LANE_2_PID"
LANE_2_STATUS=$?
wait "$LANE_1_PID"
LANE_1_STATUS=$?
set -e

trap - INT TERM
rmdir "$LANE_1_PREPARED_PATH" 2>/dev/null || true
rmdir "$LANE_CANCEL_PATH" 2>/dev/null || true
rm -f "$BARRIER_DIR/lane-1.pid" "$BARRIER_DIR/lane-2.pid"
rmdir "$BARRIER_DIR" 2>/dev/null || true

if [ "$LANE_2_STATUS" -eq 124 ]; then
    exit 124
fi

if [ "$LANE_1_STATUS" -ne 0 ]; then
    exit "$LANE_1_STATUS"
fi

exit "$LANE_2_STATUS"

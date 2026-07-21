#!/bin/bash
# Run one shard of the Maestro suite on a single booted simulator. One
# simulator lane per VM keeps the 4-vCPU guests out of CPU saturation; the
# two shards run on the two maestro VMs in parallel.
set -euo pipefail

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <app-id> <shard-number>"
    exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
APP_ID="$1"
SHARD_NUMBER="$2"
ARTIFACT_ROOT="${MAESTRO_ARTIFACT_ROOT:-$WORKSPACE_DIR/artifacts/maestro}"
MAESTRO_SUITE_RUNNER="${MAESTRO_SUITE_RUNNER:-$SCRIPT_DIR/run-maestro-suite.sh}"
RUN_TOKEN="${E2E_RUN_TOKEN:-$(date +%s)}"
UDID_PATTERN='^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$'

if [[ ! "${SIMULATOR_UDID:-}" =~ $UDID_PATTERN ]]; then
    echo "SIMULATOR_UDID must contain the booted simulator's UDID." >&2
    exit 1
fi

SHARD_FILE="$WORKSPACE_DIR/shards/shard-$SHARD_NUMBER.txt"
if [ ! -f "$SHARD_FILE" ]; then
    echo "Shard manifest not found: $SHARD_FILE" >&2
    exit 1
fi

FLOWS=()
while IFS= read -r FLOW_NAME || [ -n "$FLOW_NAME" ]; do
    if [ -z "$FLOW_NAME" ]; then
        continue
    fi
    if [ ! -f "$WORKSPACE_DIR/flows/$FLOW_NAME" ]; then
        echo "Shard $SHARD_NUMBER references a missing flow: $FLOW_NAME" >&2
        exit 1
    fi
    FLOWS+=("flows/$FLOW_NAME")
done < "$SHARD_FILE"

if [ "${#FLOWS[@]}" -eq 0 ]; then
    echo "Shard $SHARD_NUMBER contains no flows." >&2
    exit 1
fi

SHARD_ARTIFACT_DIR="$ARTIFACT_ROOT/shard-$SHARD_NUMBER"
mkdir -p "$SHARD_ARTIFACT_DIR/tmp"
printf 'Shard %s runs on simulator %s:\n%s\n' "$SHARD_NUMBER" "$SIMULATOR_UDID" "${FLOWS[*]}"

TMPDIR="$SHARD_ARTIFACT_DIR/tmp" \
    E2E_RUN_TOKEN="$RUN_TOKEN-shard-$SHARD_NUMBER" \
    sh "$MAESTRO_SUITE_RUNNER" "$APP_ID" "${FLOWS[@]}" \
    --output "$SHARD_ARTIFACT_DIR/report.xml" \
    --debug-output "$SHARD_ARTIFACT_DIR/debug" \
    --test-output-dir "$SHARD_ARTIFACT_DIR/test-output" \
    2>&1 | tee "$SHARD_ARTIFACT_DIR/maestro-console.log"
exit "${PIPESTATUS[0]}"

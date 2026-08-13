#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEVICE="${ARGENT_DEVICE:-${1:-}}"
SHARD="${ARGENT_SHARD:-${2:-}}"
ARTIFACT_GROUP="${SHARD:+shard-$SHARD}"
ARTIFACT_GROUP="${ARTIFACT_GROUP:-full-suite}"
ARTIFACT_ROOT="$WORKSPACE_DIR/artifacts/argent/$ARTIFACT_GROUP"
TIMINGS_FILE="$ARTIFACT_ROOT/flow-timings.tsv"

if [[ -z "$DEVICE" ]]; then
    echo 'Usage: ARGENT_DEVICE=<simulator-udid> ./scripts/run-argent-suite.sh [device] [shard]' >&2
    exit 2
fi

mkdir -p "$ARTIFACT_ROOT"
printf 'flow\tstatus\tattempts\tseconds\n' > "$TIMINGS_FILE"

run_flow() {
    local flow="$1"
    local output="$ARTIFACT_ROOT/${flow%.yaml}"
    local started elapsed status
    started="$(date +%s)"
    mkdir -p "$output"

    if yarn --cwd "$WORKSPACE_DIR" exec argent flow run "$WORKSPACE_DIR/flows/$flow" \
        --platform ios \
        --device "$DEVICE" \
        --output "$output"; then
        status='passed'
    else
        status='failed'
    fi

    elapsed="$(( $(date +%s) - started ))"
    printf '%s\t%s\t1\t%s\n' "$flow" "$status" "$elapsed" >> "$TIMINGS_FILE"
    [[ "$status" == 'passed' ]]
}

suite_failed=0

if [[ -n "$SHARD" ]]; then
    while IFS= read -r flow; do
        if [[ -n "$flow" ]] && ! run_flow "$flow"; then
            suite_failed=1
        fi
    done < "$WORKSPACE_DIR/shards/shard-$SHARD.txt"
else
    for flow in "$WORKSPACE_DIR"/flows/*.yaml; do
        if ! run_flow "$(basename "$flow")"; then
            suite_failed=1
        fi
    done
fi

exit "$suite_failed"

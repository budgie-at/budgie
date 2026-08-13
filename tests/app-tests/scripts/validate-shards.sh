#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
FLOWS_DIR="$WORKSPACE_DIR/flows"
SHARDS_DIR="$WORKSPACE_DIR/shards"

ACTUAL_FLOWS=$(find "$FLOWS_DIR" -maxdepth 1 -name '*.yaml' -exec basename {} \; | sort)
SHARDED_FLOWS=$(cat "$SHARDS_DIR"/shard-*.txt | sed '/^$/d' | sort)
DUPLICATED_FLOWS=$(printf '%s\n' "$SHARDED_FLOWS" | uniq -d)

if [ -n "$DUPLICATED_FLOWS" ]; then
    printf '%s\n' "$DUPLICATED_FLOWS"
    echo "Flows listed in more than one shard file under tests/app-tests/shards."
    exit 1
fi

MISSING_FLOWS=$(printf '%s\n%s\n' "$ACTUAL_FLOWS" "$SHARDED_FLOWS" | sort | uniq -u)

if [ -n "$MISSING_FLOWS" ]; then
    printf '%s\n' "$MISSING_FLOWS"
    echo "Every flows/*.yaml must appear in exactly one tests/app-tests/shards/shard-*.txt (and vice versa)."
    exit 1
fi

echo "Shards cover all $(printf '%s\n' "$ACTUAL_FLOWS" | wc -l | tr -d ' ') flows exactly once."

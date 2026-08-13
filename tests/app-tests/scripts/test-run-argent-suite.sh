#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_RUNNER="$SCRIPT_DIR/run-argent-suite.sh"
SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT

mkdir -p "$SANDBOX/scripts" "$SANDBOX/shards" "$SANDBOX/flows" "$SANDBOX/bin"
cp "$SOURCE_RUNNER" "$SANDBOX/scripts/run-argent-suite.sh"
printf 'one.yaml\ntwo.yaml\nthree.yaml\n' > "$SANDBOX/shards/shard-1.txt"
touch "$SANDBOX/flows/one.yaml" "$SANDBOX/flows/two.yaml" "$SANDBOX/flows/three.yaml"

cat > "$SANDBOX/bin/yarn" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$RUNNER_CALLS"
case "$*" in
    *two.yaml*) exit 1 ;;
    *) exit 0 ;;
esac
SH
chmod +x "$SANDBOX/bin/yarn"

set +e
RUNNER_CALLS="$SANDBOX/calls" PATH="$SANDBOX/bin:$PATH" \
    ARGENT_DEVICE=test-device ARGENT_SHARD=1 \
    "$SANDBOX/scripts/run-argent-suite.sh"
status=$?
set -e

[[ "$status" -eq 1 ]]
[[ "$(wc -l < "$SANDBOX/calls" | tr -d ' ')" -eq 3 ]]
grep -F $'one.yaml\tpassed\t1\t' "$SANDBOX/artifacts/argent/shard-1/flow-timings.tsv" >/dev/null
grep -F $'two.yaml\tfailed\t1\t' "$SANDBOX/artifacts/argent/shard-1/flow-timings.tsv" >/dev/null
grep -F $'three.yaml\tpassed\t1\t' "$SANDBOX/artifacts/argent/shard-1/flow-timings.tsv" >/dev/null

echo 'run-argent-suite aggregation test passed.'

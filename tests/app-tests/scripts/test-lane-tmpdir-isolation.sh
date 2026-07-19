#!/bin/bash
# Verifies run-ios-maestro-lanes.sh gives each lane a private TMPDIR.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# Minimal workspace layout the lanes script expects.
mkdir -p "$WORK_DIR/workspace/shards" "$WORK_DIR/workspace/flows" "$WORK_DIR/workspace/scripts"
printf 'a.flow.yaml\n' > "$WORK_DIR/workspace/shards/shard-1.txt"
printf 'b.flow.yaml\n' > "$WORK_DIR/workspace/shards/shard-2.txt"
touch "$WORK_DIR/workspace/flows/a.flow.yaml" "$WORK_DIR/workspace/flows/b.flow.yaml"

# Fake suite runner: records the TMPDIR each lane received, creates the
# first-flow marker so lane 2 unblocks.
cat > "$WORK_DIR/fake-suite.sh" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "${TMPDIR-unset}" >> "${TMPDIR_LOG:?}"
if [ -n "${MAESTRO_FIRST_FLOW_PREPARED_PATH-}" ]; then
    mkdir -p "$MAESTRO_FIRST_FLOW_PREPARED_PATH"
fi
exit 0
EOF
chmod +x "$WORK_DIR/fake-suite.sh"

cp "$SCRIPT_DIR/run-ios-maestro-lanes.sh" "$WORK_DIR/workspace/scripts/run-ios-maestro-lanes.sh"
chmod +x "$WORK_DIR/workspace/scripts/run-ios-maestro-lanes.sh"

UDID_1='AAAAAAAA-1111-1111-1111-111111111111'
UDID_2='BBBBBBBB-2222-2222-2222-222222222222'

TMPDIR_LOG="$WORK_DIR/tmpdirs.log" \
MAESTRO_ARTIFACT_ROOT="$WORK_DIR/artifacts" \
MAESTRO_SUITE_RUNNER="$WORK_DIR/fake-suite.sh" \
E2E_RUN_TOKEN=test-token \
    "$WORK_DIR/workspace/scripts/run-ios-maestro-lanes.sh" \
    com.example.app "$UDID_1" 1 "$UDID_2" 2

sort "$WORK_DIR/tmpdirs.log" > "$WORK_DIR/tmpdirs.sorted"

expected_1="$WORK_DIR/artifacts/lane-1-shard-1/tmp"
expected_2="$WORK_DIR/artifacts/lane-2-shard-2/tmp"

if ! grep -qx "$expected_1" "$WORK_DIR/tmpdirs.sorted"; then
    echo "FAIL: lane 1 TMPDIR was not $expected_1" >&2
    cat "$WORK_DIR/tmpdirs.sorted" >&2
    exit 1
fi
if ! grep -qx "$expected_2" "$WORK_DIR/tmpdirs.sorted"; then
    echo "FAIL: lane 2 TMPDIR was not $expected_2" >&2
    cat "$WORK_DIR/tmpdirs.sorted" >&2
    exit 1
fi
if [ ! -d "$expected_1" ] || [ ! -d "$expected_2" ]; then
    echo "FAIL: per-lane tmp directories were not created" >&2
    exit 1
fi

echo "PASS: per-lane TMPDIR isolation"

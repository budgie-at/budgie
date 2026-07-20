#!/bin/bash
# Verifies the recoverable-failure pattern and the stale-driver recycle helper.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# --- Part 1: pattern coverage -------------------------------------------
# shellcheck disable=SC1091
. "$SCRIPT_DIR/driver-failure-pattern.sh"

must_match=(
    'Error: kAXErrorInvalidUIElement while fetching hierarchy'
    'iOS driver not ready in time'
    'java.net.ConnectException: Connection refused'
    'java.net.SocketTimeoutException: timeout'
)
must_not_match=(
    'Assertion is false: id: TabBar.Home is visible'
    'Element not found: text matching Save'
)

for sample in "${must_match[@]}"; do
    if ! printf '%s\n' "$sample" | grep -Eiq "$MAESTRO_RECOVERABLE_FAILURE_PATTERN"; then
        echo "FAIL: pattern should match: $sample" >&2
        exit 1
    fi
done
for sample in "${must_not_match[@]}"; do
    if printf '%s\n' "$sample" | grep -Eiq "$MAESTRO_RECOVERABLE_FAILURE_PATTERN"; then
        echo "FAIL: pattern must NOT match plain test failures: $sample" >&2
        exit 1
    fi
done

# --- Part 2: recycle helper kills only this lane's xcodebuild ------------
STUB_BIN="$WORK_DIR/bin"
mkdir -p "$STUB_BIN"
UDID='AAAAAAAA-1111-1111-1111-111111111111'
OTHER_UDID='BBBBBBBB-2222-2222-2222-222222222222'

cat > "$STUB_BIN/pgrep" <<EOF
#!/bin/bash
# Stub: two xcodebuild drivers exist; only PID 101 belongs to our UDID.
if [[ "\$*" == *"$UDID"* ]]; then
    echo 101
    exit 0
fi
exit 1
EOF
cat > "$STUB_BIN/kill" <<'EOF'
#!/bin/bash
printf '%s\n' "$*" >> "${KILL_LOG:?}"
exit 0
EOF
chmod +x "$STUB_BIN/pgrep" "$STUB_BIN/kill"

KILL_LOG="$WORK_DIR/kill.log" PATH="$STUB_BIN:$PATH" \
    bash "$SCRIPT_DIR/recycle-ios-driver.sh" "$UDID"

if ! grep -q '101' "$WORK_DIR/kill.log"; then
    echo 'FAIL: recycle helper did not kill the matching driver PID' >&2
    exit 1
fi
if grep -q "$OTHER_UDID" "$WORK_DIR/kill.log"; then
    echo 'FAIL: recycle helper touched another lane' >&2
    exit 1
fi

# No-match case must succeed silently (helper is best-effort).
: > "$WORK_DIR/kill.log"
KILL_LOG="$WORK_DIR/kill.log" PATH="$STUB_BIN:$PATH" \
    bash "$SCRIPT_DIR/recycle-ios-driver.sh" "$OTHER_UDID"
if [ -s "$WORK_DIR/kill.log" ]; then
    echo 'FAIL: recycle helper killed something with no matching driver' >&2
    exit 1
fi

# --- Part 3: suite reset uses the helper and broadened pattern -----------
if ! grep -q 'driver-failure-pattern.sh' "$SCRIPT_DIR/run-maestro-suite.sh"; then
    echo 'FAIL: run-maestro-suite.sh does not source driver-failure-pattern.sh' >&2
    exit 1
fi
if ! grep -q 'recycle-ios-driver.sh' "$SCRIPT_DIR/run-maestro-suite.sh"; then
    echo 'FAIL: run-maestro-suite.sh reset path does not recycle the stale driver' >&2
    exit 1
fi

echo "PASS: driver recovery"

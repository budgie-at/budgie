#!/bin/bash
# Verifies prepare-macos-ci-guest.sh applies image hygiene idempotently.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

STUB_BIN="$WORK_DIR/bin"
mkdir -p "$STUB_BIN" "$WORK_DIR/launchdaemons"

for tool in launchctl mdutil; do
    cat > "$STUB_BIN/$tool" <<EOF
#!/bin/bash
printf '$tool %s\n' "\$*" >> "${WORK_DIR}/calls.log"
exit 0
EOF
    chmod +x "$STUB_BIN/$tool"
done

LAUNCH_DAEMONS_DIR="$WORK_DIR/launchdaemons" PATH="$STUB_BIN:$PATH" \
    bash "$SCRIPT_DIR/prepare-macos-ci-guest.sh"

LOG="$WORK_DIR/calls.log"

grep -q 'launchctl disable system/com.apple.diagnosticd' "$LOG" \
    || { echo 'FAIL: diagnosticd was not disabled persistently (bootout alone does not survive the image-build reboot)' >&2; exit 1; }
grep -q 'launchctl bootout system/com.apple.diagnosticd' "$LOG" \
    || { echo 'FAIL: diagnosticd was not booted out' >&2; exit 1; }
grep -q 'mdutil -a -i off' "$LOG" \
    || { echo 'FAIL: Spotlight indexing was not disabled' >&2; exit 1; }

for plist in ci.limit.maxfiles.plist ci.limit.maxproc.plist; do
    [ -f "$WORK_DIR/launchdaemons/$plist" ] \
        || { echo "FAIL: $plist was not installed" >&2; exit 1; }
    grep -q 'launchctl load -w '"$WORK_DIR/launchdaemons/$plist" "$LOG" \
        || { echo "FAIL: $plist was not loaded" >&2; exit 1; }
done

grep -q '300000' "$WORK_DIR/launchdaemons/ci.limit.maxfiles.plist" \
    || { echo 'FAIL: maxfiles limit value missing' >&2; exit 1; }
grep -q '4000' "$WORK_DIR/launchdaemons/ci.limit.maxproc.plist" \
    || { echo 'FAIL: maxproc limit value missing' >&2; exit 1; }

# Idempotency: second run must not fail.
LAUNCH_DAEMONS_DIR="$WORK_DIR/launchdaemons" PATH="$STUB_BIN:$PATH" \
    bash "$SCRIPT_DIR/prepare-macos-ci-guest.sh"

echo "PASS: prepare-macos-ci-guest"

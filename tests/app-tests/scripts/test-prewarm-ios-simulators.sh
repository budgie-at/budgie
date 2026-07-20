#!/bin/bash
# Verifies prewarm-ios-simulators.sh creates the missing second device,
# boots+settles+shuts down both, and records UDIDs.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

STUB_BIN="$WORK_DIR/bin"
mkdir -p "$STUB_BIN"
EXISTING='AAAAAAAA-1111-1111-1111-111111111111'
CREATED='BBBBBBBB-2222-2222-2222-222222222222'
RUNTIME='com.apple.CoreSimulator.SimRuntime.iOS-26-5'

cat > "$STUB_BIN/xcrun" <<EOF
#!/bin/bash
printf '%s\n' "\$*" >> "${WORK_DIR}/xcrun.log"
case "\$*" in
    'simctl list devices available -j')
        if [ -f "$WORK_DIR/second-created" ]; then
            cat <<JSON
{"devices":{"$RUNTIME":[
  {"udid":"$EXISTING","name":"iPhone 17 Pro","isAvailable":true,"deviceTypeIdentifier":"com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro"},
  {"udid":"$CREATED","name":"iPhone 17 Pro","isAvailable":true,"deviceTypeIdentifier":"com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro"}
]}}
JSON
        else
            cat <<JSON
{"devices":{"$RUNTIME":[
  {"udid":"$EXISTING","name":"iPhone 17 Pro","isAvailable":true,"deviceTypeIdentifier":"com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro"}
]}}
JSON
        fi
        ;;
    'simctl clone '*)
        touch "$WORK_DIR/second-created"
        echo "$CREATED"
        ;;
    'simctl bootstatus '*) exit 0 ;;
    *) exit 0 ;;
esac
EOF
cat > "$STUB_BIN/defaults" <<EOF
#!/bin/bash
printf 'defaults %s\n' "\$*" >> "${WORK_DIR}/xcrun.log"
exit 0
EOF
chmod +x "$STUB_BIN/xcrun" "$STUB_BIN/defaults"

HOME="$WORK_DIR/home" SETTLE_SECONDS=0 PATH="$STUB_BIN:$PATH" \
    bash "$SCRIPT_DIR/prewarm-ios-simulators.sh"

LOG="$WORK_DIR/xcrun.log"

grep -q "simctl clone $EXISTING iPhone 17 Pro" "$LOG" \
    || { echo 'FAIL: second device was not warm-cloned from the first' >&2; exit 1; }
grep -q "simctl boot $EXISTING" "$LOG" \
    || { echo 'FAIL: existing device was not booted for settling' >&2; exit 1; }
grep -q "simctl boot $CREATED" "$LOG" \
    || { echo 'FAIL: created device was not booted for settling' >&2; exit 1; }
grep -q "simctl shutdown $EXISTING" "$LOG" \
    || { echo 'FAIL: existing device was not shut down after settling' >&2; exit 1; }
grep -q "simctl shutdown $CREATED" "$LOG" \
    || { echo 'FAIL: created device was not shut down after settling' >&2; exit 1; }
grep -q 'defaults write com.apple.iphonesimulator PasteboardAutomaticSync -bool false' "$LOG" \
    || { echo 'FAIL: pasteboard sync was not disabled' >&2; exit 1; }

RECORD="$WORK_DIR/home/.budgie-ci/simulators.json"
[ -f "$RECORD" ] || { echo 'FAIL: simulators.json was not written' >&2; exit 1; }
grep -q "$EXISTING" "$RECORD" && grep -q "$CREATED" "$RECORD" && grep -q "$RUNTIME" "$RECORD" \
    || { echo 'FAIL: simulators.json is missing UDIDs or runtime' >&2; cat "$RECORD" >&2; exit 1; }

echo "PASS: prewarm-ios-simulators"

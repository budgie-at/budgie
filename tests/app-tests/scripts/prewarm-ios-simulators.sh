#!/bin/bash
# Image-build-time prewarm: leaves the guest with two settled iPhone 17 Pro
# Simulator devices on the newest runtime so CI jobs never pay a first-boot
# indexing storm. Idempotent. Run inside the macOS base VM as the CI user.
#
#   SETTLE_SECONDS  post-boot settle wait per device (default 180)
set -euo pipefail

DEVICE_TYPE='com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro'
DEVICE_NAME='iPhone 17 Pro'
SETTLE_SECONDS="${SETTLE_SECONDS:-180}"
RECORD_DIR="$HOME/.budgie-ci"

select_devices() {
    xcrun simctl list devices available -j | node -e '
        let input = "";
        process.stdin.on("data", chunk => input += chunk);
        process.stdin.on("end", () => {
            const deviceType = "com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro";
            const inventory = JSON.parse(input).devices;
            const candidates = Object.entries(inventory)
                .map(([runtime, devices]) => [
                    runtime,
                    devices.filter(device =>
                        device.isAvailable !== false &&
                        device.name === "iPhone 17 Pro" &&
                        device.deviceTypeIdentifier === deviceType
                    ),
                ])
                .filter(([, devices]) => devices.length > 0)
                .sort(([left], [right]) =>
                    right.localeCompare(left, undefined, { numeric: true })
                );
            if (candidates.length === 0) return;
            const [runtime, devices] = candidates[0];
            process.stdout.write([runtime, ...devices.map(device => device.udid)].join("\n"));
        });
    '
}

settle_device() {
    local udid="$1"
    echo "Prewarming $udid (settle ${SETTLE_SECONDS}s)"
    xcrun simctl boot "$udid" 2>/dev/null || true
    xcrun simctl bootstatus "$udid" -b
    sleep "$SETTLE_SECONDS"
    xcrun simctl shutdown "$udid"
}

# Cross-Simulator pasteboard sync causes deadlocks between concurrent lanes.
defaults write com.apple.iphonesimulator PasteboardAutomaticSync -bool false

selection="$(select_devices)"
RUNTIME="$(printf '%s\n' "$selection" | sed -n '1p')"
UDID_1="$(printf '%s\n' "$selection" | sed -n '2p')"
UDID_2="$(printf '%s\n' "$selection" | sed -n '3p')"

if [ -z "$RUNTIME" ] || [ -z "$UDID_1" ]; then
    echo "No available $DEVICE_NAME device or runtime found; create one in Xcode first." >&2
    exit 1
fi

if [ -z "$UDID_2" ]; then
    echo "Creating second $DEVICE_NAME by warm-cloning $UDID_1"
    UDID_2="$(xcrun simctl clone "$UDID_1" "$DEVICE_NAME")"
fi

if [ -z "$UDID_2" ] || [ "$UDID_1" = "$UDID_2" ]; then
    echo "Failed to obtain two distinct $DEVICE_NAME devices." >&2
    exit 1
fi

settle_device "$UDID_1"
settle_device "$UDID_2"

mkdir -p "$RECORD_DIR"
printf '{"runtime":"%s","udids":["%s","%s"]}\n' "$RUNTIME" "$UDID_1" "$UDID_2" \
    > "$RECORD_DIR/simulators.json"

echo "Prewarmed devices on $RUNTIME:"
echo "  lane 1: $UDID_1"
echo "  lane 2: $UDID_2"

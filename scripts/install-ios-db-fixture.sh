#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    echo "Usage: $0 <fixture-path> [target-filename]" >&2
    exit 1
fi

FIXTURE_PATH="$1"
TARGET_NAME="${2:-$(basename "$FIXTURE_PATH")}"

if [ ! -f "$FIXTURE_PATH" ]; then
    echo "Fixture not found: $FIXTURE_PATH" >&2
    exit 1
fi

BOOTED_UDID="$(
    xcrun simctl list devices booted |
        sed -n 's/.*(\([A-F0-9-]\{36\}\)) (Booted).*/\1/p' |
        head -n 1
)"

if [ -z "$BOOTED_UDID" ]; then
    echo "No booted iOS simulator found." >&2
    exit 1
fi

APP_GROUP_ROOT="$HOME/Library/Developer/CoreSimulator/Devices/$BOOTED_UDID/data/Containers/Shared/AppGroup"

if [ ! -d "$APP_GROUP_ROOT" ]; then
    echo "Simulator AppGroup root not found: $APP_GROUP_ROOT" >&2
    exit 1
fi

FOUND=0

while IFS= read -r provider_dir; do
    cp "$FIXTURE_PATH" "$provider_dir/$TARGET_NAME"
    echo "Installed $TARGET_NAME into $provider_dir"
    FOUND=1
done < <(find "$APP_GROUP_ROOT" -type d -name 'File Provider Storage')

if [ "$FOUND" -eq 0 ]; then
    echo "No File Provider Storage directories found under $APP_GROUP_ROOT" >&2
    exit 1
fi

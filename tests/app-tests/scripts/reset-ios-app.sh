#!/bin/sh

set -eu

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <app-id> <app-binary-path> [simulator-udid]"
    exit 1
fi

APP_ID="$1"
APP_PATH="$2"
SIMULATOR_UDID="${3:-}"

if [ -z "$SIMULATOR_UDID" ]; then
    SIMULATOR_UDID=$(
        xcrun simctl list devices booted \
            | awk -F '[()]' '/Booted/{print $2; exit}'
    )
fi

if [ -z "$SIMULATOR_UDID" ]; then
    echo "No booted simulator found"
    exit 1
fi

echo "Resetting $APP_ID on simulator $SIMULATOR_UDID"
xcrun simctl terminate "$SIMULATOR_UDID" "$APP_ID" || true
xcrun simctl uninstall "$SIMULATOR_UDID" "$APP_ID" || true
xcrun simctl install "$SIMULATOR_UDID" "$APP_PATH"
xcrun simctl privacy "$SIMULATOR_UDID" grant contacts "$APP_ID" || true

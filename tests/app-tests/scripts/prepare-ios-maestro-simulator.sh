#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <simulator-udid> <app-path>" >&2
    exit 1
fi

SIMULATOR_UDID="$1"
APP_PATH="$2"
UDID_PATTERN='^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$'

if [[ ! "$SIMULATOR_UDID" =~ $UDID_PATTERN ]]; then
    echo "A valid simulator UDID is required." >&2
    exit 1
fi

case "$APP_PATH" in
    *.app)
        ;;
    *)
        echo "A readable .app bundle directory is required: $APP_PATH" >&2
        exit 1
        ;;
esac

if [ ! -d "$APP_PATH" ] || [ ! -r "$APP_PATH" ]; then
    echo "A readable .app bundle directory is required: $APP_PATH" >&2
    exit 1
fi

for attempt in 1 2 3; do
    echo "Booting simulator $SIMULATOR_UDID (attempt $attempt/3)"
    xcrun simctl boot "$SIMULATOR_UDID" 2>/dev/null || true

    if xcrun simctl bootstatus "$SIMULATOR_UDID" -b; then
        echo "Installing app on simulator $SIMULATOR_UDID from: $APP_PATH"
        xcrun simctl install "$SIMULATOR_UDID" "$APP_PATH"
        exit 0
    fi

    xcrun simctl shutdown "$SIMULATOR_UDID" 2>/dev/null || true
done

echo "Simulator $SIMULATOR_UDID did not finish booting after 3 attempts." >&2
exit 1

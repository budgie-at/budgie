#!/bin/sh
set -eu

PLIST_PATH="${1:-ios/budgieE2E/Info.plist}"

if [ ! -f "$PLIST_PATH" ]; then
    echo "Info.plist not found at $PLIST_PATH" >&2
    exit 1
fi

/usr/libexec/PlistBuddy -c "Delete :NSMicrophoneUsageDescription" "$PLIST_PATH" >/dev/null 2>&1 || true
/usr/libexec/PlistBuddy -c "Delete :UIBackgroundModes" "$PLIST_PATH" >/dev/null 2>&1 || true

echo "Applied E2E iOS Info.plist cleanup to $PLIST_PATH"

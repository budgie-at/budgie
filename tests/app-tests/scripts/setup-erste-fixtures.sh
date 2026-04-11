#!/bin/sh
set -eu

DEVICE_ID="${1:-booted}"
APP_ID="${2:-com.vitalyiegorov.budgie.e2e}"

BUNDLE_PATH=$(xcrun simctl get_app_container "$DEVICE_ID" "$APP_ID")
APP_DATA=$(xcrun simctl get_app_container "$DEVICE_ID" "$APP_ID" data)
FIXTURES_DIR="$APP_DATA/Documents/E2EFixtures"
PLIST="$BUNDLE_PATH/Info.plist"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

/usr/libexec/PlistBuddy -c "Add :UIFileSharingEnabled bool true" "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :UIFileSharingEnabled true" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :LSSupportsOpeningDocumentsInPlace bool true" "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :LSSupportsOpeningDocumentsInPlace true" "$PLIST"

mkdir -p "$FIXTURES_DIR"

cp "$REPO_ROOT/AT802011184943859800_2026008.pdf" "$FIXTURES_DIR/"
cp "$REPO_ROOT/AT802011184943859800_2026009.pdf" "$FIXTURES_DIR/"

echo "Erste fixtures ready"

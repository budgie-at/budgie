#!/bin/sh
set -eu

DEVICE_ID="${1:-booted}"
APP_ID="${2:-com.vitalyiegorov.budgie.e2e}"
APP_DATA=$(xcrun simctl get_app_container "$DEVICE_ID" "$APP_ID" data)
FIXTURES_DIR="$APP_DATA/Documents/E2EFixtures"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
ERSTE_FIXTURES_DIR="$REPO_ROOT/tests/app-tests/fixtures/erste"

xcrun simctl terminate "$DEVICE_ID" com.apple.DocumentsApp >/dev/null 2>&1 || true
mkdir -p "$FIXTURES_DIR"
rm -f "$FIXTURES_DIR/erste-statement-008.pdf"
rm -f "$FIXTURES_DIR/erste-statement-009.pdf"

cp "$ERSTE_FIXTURES_DIR/erste-statement-008.pdf" "$FIXTURES_DIR/"
cp "$ERSTE_FIXTURES_DIR/erste-statement-009.pdf" "$FIXTURES_DIR/"

xcrun simctl terminate "$DEVICE_ID" com.apple.DocumentsApp >/dev/null 2>&1 || true

echo "Erste fixtures ready in app documents: $FIXTURES_DIR"

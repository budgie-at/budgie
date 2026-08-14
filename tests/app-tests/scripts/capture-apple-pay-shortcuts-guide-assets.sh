#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
SIMULATOR_UDID="${1:-${SIMULATOR_UDID:-booted}}"
APP_ID="${2:-${APP_ID:-com.vitalyiegorov.budgie.e2e}}"
INSTALL_GUIDE_FIXTURES_SCRIPT="${INSTALL_GUIDE_FIXTURES_SCRIPT:-$SCRIPT_DIR/install-apple-pay-shortcuts-guide-fixtures.sh}"
RUN_MAESTRO_SUITE_SCRIPT="${RUN_MAESTRO_SUITE_SCRIPT:-$SCRIPT_DIR/run-maestro-suite.sh}"
ASSET_OUTPUT_DIR="${ASSET_OUTPUT_DIR:-$PROJECT_ROOT/packages/landing/public/images/apple-pay-shortcuts-instructions}"
CAPTURE_OUTPUT_DIR="$WORKSPACE_DIR/artifacts/apple-pay-shortcuts-guide-capture"
SETTINGS_SCREEN_PATH="$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png"
SETUP_SCREEN_PATH="$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png"
REVIEW_SCREEN_PATH="$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png"
mkdir -p "$ASSET_OUTPUT_DIR" "$CAPTURE_OUTPUT_DIR"
STAGED_SCREENSHOT_DIR=$(mktemp -d "$CAPTURE_OUTPUT_DIR/staged.XXXXXX")
STAGED_SETTINGS_SCREEN_PATH="$STAGED_SCREENSHOT_DIR/apple-pay-capture-settings-screen.png"
STAGED_SETUP_SCREEN_PATH="$STAGED_SCREENSHOT_DIR/apple-pay-capture-setup-screen.png"
STAGED_REVIEW_SCREEN_PATH="$STAGED_SCREENSHOT_DIR/apple-pay-capture-review-screen.png"
PROMOTION_SETTINGS_SCREEN_PATH=$(mktemp "$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png.XXXXXX")
PROMOTION_SETUP_SCREEN_PATH=$(mktemp "$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png.XXXXXX")
PROMOTION_REVIEW_SCREEN_PATH=$(mktemp "$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png.XXXXXX")
TRIGGER_WEBP_PATH="$ASSET_OUTPUT_DIR/shortcuts-trigger-selection.webp"
ACTION_WEBP_PATH="$ASSET_OUTPUT_DIR/shortcuts-action-binding.webp"
SAVE_WEBP_PATH="$ASSET_OUTPUT_DIR/shortcuts-save-automation.webp"

cleanup() {
    rm -rf "$STAGED_SCREENSHOT_DIR"
    rm -f "$PROMOTION_SETTINGS_SCREEN_PATH" "$PROMOTION_SETUP_SCREEN_PATH" "$PROMOTION_REVIEW_SCREEN_PATH"
}

trap cleanup EXIT

capture_screen() {
    FLOW_PATH="$1"
    OUTPUT_PATH="$2"

    MAESTRO_SKIP_FIXTURE_REFRESH=true sh "$RUN_MAESTRO_SUITE_SCRIPT" "$APP_ID" "$FLOW_PATH" --debug-output "$CAPTURE_OUTPUT_DIR"
    xcrun simctl io "$SIMULATOR_UDID" screenshot "$OUTPUT_PATH"
}

sh "$INSTALL_GUIDE_FIXTURES_SCRIPT" "$SIMULATOR_UDID" "$APP_ID"

capture_screen "flows/setup/capture-apple-pay-shortcuts-settings.flow.yaml" "$STAGED_SETTINGS_SCREEN_PATH"
capture_screen "flows/setup/capture-apple-pay-shortcuts-setup.flow.yaml" "$STAGED_SETUP_SCREEN_PATH"
capture_screen "flows/setup/capture-apple-pay-shortcuts-review.flow.yaml" "$STAGED_REVIEW_SCREEN_PATH"

for EXPECTED_ASSET_PATH in \
    "$STAGED_SETTINGS_SCREEN_PATH" \
    "$STAGED_SETUP_SCREEN_PATH" \
    "$STAGED_REVIEW_SCREEN_PATH" \
    "$TRIGGER_WEBP_PATH" \
    "$ACTION_WEBP_PATH" \
    "$SAVE_WEBP_PATH"; do
    if [ ! -s "$EXPECTED_ASSET_PATH" ]; then
        echo "Expected guide asset is missing or empty: $EXPECTED_ASSET_PATH" >&2
        exit 1
    fi
done

cp "$STAGED_SETTINGS_SCREEN_PATH" "$PROMOTION_SETTINGS_SCREEN_PATH"
cp "$STAGED_SETUP_SCREEN_PATH" "$PROMOTION_SETUP_SCREEN_PATH"
cp "$STAGED_REVIEW_SCREEN_PATH" "$PROMOTION_REVIEW_SCREEN_PATH"

for PROMOTION_ASSET_PATH in \
    "$PROMOTION_SETTINGS_SCREEN_PATH" \
    "$PROMOTION_SETUP_SCREEN_PATH" \
    "$PROMOTION_REVIEW_SCREEN_PATH"; do
    if [ ! -s "$PROMOTION_ASSET_PATH" ]; then
        echo "Prepared guide asset is missing or empty: $PROMOTION_ASSET_PATH" >&2
        exit 1
    fi
done

mv "$PROMOTION_SETTINGS_SCREEN_PATH" "$SETTINGS_SCREEN_PATH"
mv "$PROMOTION_SETUP_SCREEN_PATH" "$SETUP_SCREEN_PATH"
mv "$PROMOTION_REVIEW_SCREEN_PATH" "$REVIEW_SCREEN_PATH"

echo "Captured Apple Pay Shortcuts guide assets in $ASSET_OUTPUT_DIR"

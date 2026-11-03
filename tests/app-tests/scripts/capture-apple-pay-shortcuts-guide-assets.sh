#!/bin/sh
# Captures the Apple Pay Shortcuts guide's three app screens for the landing
# page through the e2e project's media capture: the apple-pay-capture-*
# scenes in e2e/support/media/scenes.ts install the guide database and its
# pending Apple Pay captures, then walk to the settings card, the setup and
# the review screens, on a simulator leased from the simlock farm.
#
# Usage:
#   E2E_APP_PATH=<path/to/.app> SIMLOCK_URL=<gateway> SIMLOCK_TOKEN=<agent token> \
#     sh tests/app-tests/scripts/capture-apple-pay-shortcuts-guide-assets.sh
# Needs the e2e project's dependencies (`npm ci` in e2e/) and sqlite3.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
E2E_DIR="${CAPTURE_E2E_DIR:-$PROJECT_ROOT/e2e}"
APP_ID="${APP_ID:-com.vitalyiegorov.budgie.e2e}"
DEVICE="${SCREENSHOT_DEVICE:-iPhone 17 Pro}"
ASSET_OUTPUT_DIR="${ASSET_OUTPUT_DIR:-$PROJECT_ROOT/packages/landing/public/images/apple-pay-shortcuts-instructions}"
CAPTURE_OUTPUT_DIR="$WORKSPACE_DIR/artifacts/apple-pay-shortcuts-guide-capture"
SETTINGS_SCREEN_PATH="$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png"
SETUP_SCREEN_PATH="$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png"
REVIEW_SCREEN_PATH="$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png"
TRIGGER_WEBP_PATH="$ASSET_OUTPUT_DIR/shortcuts-trigger-selection.webp"
ACTION_WEBP_PATH="$ASSET_OUTPUT_DIR/shortcuts-action-binding.webp"
SAVE_WEBP_PATH="$ASSET_OUTPUT_DIR/shortcuts-save-automation.webp"

: "${E2E_APP_PATH:?E2E_APP_PATH is required: the simulator .app to capture}"
: "${SIMLOCK_URL:?SIMLOCK_URL is required: the simlock gateway}"
: "${SIMLOCK_TOKEN:?SIMLOCK_TOKEN is required: a simlock agent token}"

mkdir -p "$ASSET_OUTPUT_DIR" "$CAPTURE_OUTPUT_DIR"
STAGED_SCREENSHOT_DIR=$(mktemp -d "$CAPTURE_OUTPUT_DIR/staged.XXXXXX")
STAGED_SETTINGS_SCREEN_PATH="$STAGED_SCREENSHOT_DIR/apple-pay-capture-settings-screen.png"
STAGED_SETUP_SCREEN_PATH="$STAGED_SCREENSHOT_DIR/apple-pay-capture-setup-screen.png"
STAGED_REVIEW_SCREEN_PATH="$STAGED_SCREENSHOT_DIR/apple-pay-capture-review-screen.png"
PLAN_PATH="$STAGED_SCREENSHOT_DIR/plan.json"
PROMOTION_SETTINGS_SCREEN_PATH=$(mktemp "$ASSET_OUTPUT_DIR/apple-pay-capture-settings-screen.png.XXXXXX")
PROMOTION_SETUP_SCREEN_PATH=$(mktemp "$ASSET_OUTPUT_DIR/apple-pay-capture-setup-screen.png.XXXXXX")
PROMOTION_REVIEW_SCREEN_PATH=$(mktemp "$ASSET_OUTPUT_DIR/apple-pay-capture-review-screen.png.XXXXXX")

cleanup() {
    rm -rf "$STAGED_SCREENSHOT_DIR"
    rm -f "$PROMOTION_SETTINGS_SCREEN_PATH" "$PROMOTION_SETUP_SCREEN_PATH" "$PROMOTION_REVIEW_SCREEN_PATH"
}

trap cleanup EXIT

# One run, three cells, in English and the light appearance the guide shows.
cell() {
    printf '{"scene": "%s", "test": "%s", "locale": "en", "appearance": "light", "path": "%s"}' "$1" "$1" "$2"
}
printf '[%s,%s,%s]\n' \
    "$(cell apple-pay-capture-settings-screen "$STAGED_SETTINGS_SCREEN_PATH")" \
    "$(cell apple-pay-capture-setup-screen "$STAGED_SETUP_SCREEN_PATH")" \
    "$(cell apple-pay-capture-review-screen "$STAGED_REVIEW_SCREEN_PATH")" > "$PLAN_PATH"

(
    cd "$E2E_DIR"
    SCREENSHOT_PLAN="$PLAN_PATH" SCREENSHOT_DEVICE="$DEVICE" E2E_APP_ID="$APP_ID" E2E_WORKERS=1 \
        npx e2e run --config media.config.ts --target ios
)

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

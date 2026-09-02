#!/bin/bash
# Verifies compose-screenshots.sh still composes the App Store set after the
# frameit lookup, device geometry, locale mapping and cutout compositing moved
# into the shared frame-device.sh that compose-web-media.sh also sources: an
# opaque palette plate, a burned-in caption, and output at the exact pixel size
# of the capture, which is what deliver matches App Store Connect slots on.
# Runs anywhere: frameit frames and raw captures are synthesised with
# ImageMagick into a scratch HOME, and the design directory is copied into a
# scratch tree so the committed variants/ sets are never touched.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
DESIGN_DIR="$REPO_ROOT/packages/app/fastlane/screenshots/design"

if ! command -v magick >/dev/null 2>&1; then
    echo "skip test-compose-screenshots: ImageMagick 7 ('magick') is not installed"

    exit 0
fi

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

FAILURES=0

pass() {
    echo "ok   $1"
}

assert_equals() {
    local label="$1" actual="$2" expected="$3"
    if [ "$actual" = "$expected" ]; then
        pass "$label"
    else
        echo "FAIL $label: expected '$expected', got '$actual'"
        FAILURES=$((FAILURES + 1))
    fi
}

synthesize_frame() {
    local out="$1" frame_w="$2" frame_h="$3" cut_x="$4" cut_y="$5" cut_w="$6" cut_h="$7"
    local right=$((cut_x + cut_w - 1))
    local bottom=$((cut_y + cut_h - 1))
    local mask="$WORK_DIR/frame-mask.png"
    magick -size "${frame_w}x${frame_h}" xc:white -fill black \
        -draw "rectangle ${cut_x},${cut_y} ${right},${bottom}" -alpha off "$mask"
    magick -size "${frame_w}x${frame_h}" xc:'#1A1A1A' "$mask" \
        -alpha off -compose CopyOpacity -composite -define png:color-type=6 "$out"
    rm -f "$mask"
}

FAKE_HOME="$WORK_DIR/home"
FRAMES_DIR="$FAKE_HOME/.fastlane/frameit/latest"
mkdir -p "$FRAMES_DIR"
synthesize_frame "$FRAMES_DIR/Apple iPhone 16 Pro Max Black Titanium.png" 1470 3000 75 66 1320 2868
synthesize_frame "$FRAMES_DIR/Apple iPad Pro (12.9-inch) (4th generation) Space Gray.png" 2245 2930 96 102 2048 2732

RAW_DIR="$WORK_DIR/raw/ios/iphone-17-pro-max/en/light"
mkdir -p "$RAW_DIR"
for scene in 01-home 02-transactions 03-analytics 04-budget 05-add-expense 06-account 07-settings; do
    magick -size 1320x2868 gradient:'#3366FF-#FFFFFF' -alpha off "$RAW_DIR/$scene.png"
done

# The script publishes into <design>/../variants, so it runs from a scratch copy
# of the design directory and can never overwrite the committed store sets.
SCRATCH_DESIGN="$WORK_DIR/screenshots/design"
mkdir -p "$SCRATCH_DESIGN/en-US"
cp "$DESIGN_DIR/compose-screenshots.sh" "$DESIGN_DIR/frame-device.sh" "$SCRATCH_DESIGN/"
cp "$DESIGN_DIR/en-US/title.strings" "$DESIGN_DIR/en-US/subtitle.strings" "$SCRATCH_DESIGN/en-US/"

HOME="$FAKE_HOME" \
    CAPTION_FONT="$REPO_ROOT/packages/app/assets/fonts/FixelDisplay-Bold.ttf" \
    SCREENSHOTS_RAW_DIR="$WORK_DIR/raw" \
    PUBLISH_VARIANT_NAME=selftest \
    bash "$SCRATCH_DESIGN/compose-screenshots.sh" en-US light --device iphone > "$WORK_DIR/compose.log" 2>&1 || {
    echo "FAIL compose-screenshots.sh exited non-zero:"
    cat "$WORK_DIR/compose.log"

    exit 1
}

PUBLISHED_DIR="$WORK_DIR/screenshots/variants/selftest/ios/en-US"
assert_equals 'the whole iPhone run is published' \
    "$(find "$PUBLISHED_DIR" -maxdepth 1 -name '*.png' | wc -l | tr -d ' ')" '7'

HOME_SHOT="$PUBLISHED_DIR/01_iphone_home.png"
assert_equals 'output keeps the exact capture pixel size deliver matches slots on' \
    "$(magick identify -format "%wx%h" "$HOME_SHOT")" '1320x2868'
assert_equals 'the store variant stays opaque (it ships a palette plate)' \
    "$(magick identify -format "%A" "$HOME_SHOT")" 'Undefined'
assert_equals 'the light palette plate fills the canvas corner' \
    "$(magick "$HOME_SHOT" -format "%[hex:p{0,0}]" info:)" 'F8F8F8'
assert_equals 'the caption stack is burned into the canvas' \
    "$(magick "$HOME_SHOT" -crop 1320x220+0+140 +repage -colorspace gray -format "%[fx:minima < 0.3]" info:)" '1'
assert_equals 'the framed device covers the middle of the canvas' \
    "$(magick "$HOME_SHOT" -format "%[fx:p{660,1600}.r < 0.9]" info:)" '1'

if [ "$FAILURES" -eq 0 ]; then
    echo "test-compose-screenshots: all checks passed"

    exit 0
fi

echo "test-compose-screenshots: $FAILURES check(s) failed" >&2

exit 1

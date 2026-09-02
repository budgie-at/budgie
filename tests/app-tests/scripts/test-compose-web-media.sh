#!/bin/bash
# Verifies compose-web-media.sh produces landing-shaped assets from raw captures:
# transparent outside the device frame, no caption and no plate, output at the
# exact pixel size of the capture, one copy per landing route slug the scene
# feeds, plus the unframed rounded-corner mode.
# Runs anywhere: frameit frames and raw captures are synthesised with ImageMagick
# into a scratch HOME, so no simulator and no fastlane cache are needed.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
TARGET="$REPO_ROOT/packages/app/fastlane/screenshots/design/compose-web-media.sh"

if ! command -v magick >/dev/null 2>&1; then
    echo "skip test-compose-web-media: ImageMagick 7 ('magick') is not installed"

    exit 0
fi
if ! command -v jq >/dev/null 2>&1; then
    echo "skip test-compose-web-media: 'jq' is not installed"

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

assert_file() {
    local label="$1" path="$2"
    if [ -f "$path" ]; then
        pass "$label"
    else
        echo "FAIL $label: no file at $path"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_no_file() {
    local label="$1" path="$2"
    if [ -f "$path" ]; then
        echo "FAIL $label: unexpected file at $path"
        FAILURES=$((FAILURES + 1))
    else
        pass "$label"
    fi
}

assert_fails() {
    local label="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        echo "FAIL $label: expected a non-zero exit"
        FAILURES=$((FAILURES + 1))
    else
        pass "$label"
    fi
}

# Alpha of one pixel, 0 (transparent) or 1 (opaque), read off the alpha channel.
alpha_at() {
    magick "$1" -alpha extract -format "%[fx:round(p{$2,$3})]" info:
}

dimensions_of() {
    magick identify -format "%wx%h" "$1"
}

# A frameit frame is an opaque device body with one fully transparent enclosed
# screen opening. compose-web-media.sh flood-fills the border-connected
# transparent region out of the alpha mask, so an opaque outer border is enough
# to stand in for the real asset's rounded corners.
synthesize_frame() {
    local out="$1" frame_w="$2" frame_h="$3" cut_x="$4" cut_y="$5" cut_w="$6" cut_h="$7"
    local mask="$WORK_DIR/frame-mask.png"
    magick -size "${frame_w}x${frame_h}" xc:white -fill black \
        -draw "rectangle ${cut_x},${cut_y} $((cut_x + cut_w - 1)),$((cut_y + cut_h - 1))" \
        -alpha off "$mask"
    magick -size "${frame_w}x${frame_h}" xc:'#1A1A1A' "$mask" \
        -alpha off -compose CopyOpacity -composite -define png:color-type=6 "$out"
    rm -f "$mask"
}

synthesize_capture() {
    local out="$1" width="$2" height="$3" colour="$4"
    mkdir -p "$(dirname "$out")"
    magick -size "${width}x${height}" "gradient:${colour}-#FFFFFF" -alpha off "$out"
}

FAKE_HOME="$WORK_DIR/home"
FRAMES_DIR="$FAKE_HOME/.fastlane/frameit/latest"
mkdir -p "$FRAMES_DIR"
synthesize_frame "$FRAMES_DIR/Apple iPhone 16 Pro Max Black Titanium.png" 1470 3000 75 66 1320 2868
synthesize_frame "$FRAMES_DIR/Apple iPad Pro (12.9-inch) (4th generation) Space Gray.png" 2245 2930 96 102 2048 2732

RAW_DIR="$WORK_DIR/raw"
synthesize_capture "$RAW_DIR/ios/iphone-17-pro-max/en/light/home-hero-1.png" 1320 2868 '#3366FF'
synthesize_capture "$RAW_DIR/ios/iphone-17-pro-max/en/dark/home-hero-1.png" 1320 2868 '#101820'
synthesize_capture "$RAW_DIR/ios/ipad-pro-13-inch-m4/en/light/home-hero-1.png" 2064 2752 '#3366FF'
synthesize_capture "$RAW_DIR/ios/iphone-17-pro-max/en/light/pin-app-lock-1.png" 1320 2868 '#22AA55'

GROUPS_MAP="$WORK_DIR/groups.json"
cat > "$GROUPS_MAP" <<'JSON'
{
    "scenes": {
        "home-hero-1": { "groups": ["home"], "devices": ["iphone", "ipad"], "budget": "hero" },
        "pin-app-lock-1": { "groups": ["pin-app-lock", "privacy", "security"] },
        "never-captured-1": { "groups": ["never-captured"] }
    }
}
JSON

OUT_DIR="$WORK_DIR/media"

DEVICE_OUTPUT="$(HOME="$FAKE_HOME" bash "$TARGET" en all \
    --groups "$GROUPS_MAP" --raw-dir "$RAW_DIR" --output "$OUT_DIR" 2>&1)"

assert_file 'framed iPhone light lands under its route slug' "$OUT_DIR/home/en/light/home-hero-1@2x.png"
assert_file 'framed iPhone dark lands under its route slug' "$OUT_DIR/home/en/dark/home-hero-1@2x.png"
assert_file 'framed iPad carries the -ipad suffix' "$OUT_DIR/home/en/light/home-hero-1-ipad@2x.png"
assert_file 'a reused scene is aliased into every group (owner)' "$OUT_DIR/pin-app-lock/en/light/pin-app-lock-1@2x.png"
assert_file 'a reused scene is aliased into every group (privacy hub)' "$OUT_DIR/privacy/en/light/pin-app-lock-1@2x.png"
assert_file 'a reused scene is aliased into every group (security hub)' "$OUT_DIR/security/en/light/pin-app-lock-1@2x.png"
assert_no_file 'an uncaptured scene produces nothing' "$OUT_DIR/never-captured/en/light/never-captured-1@2x.png"

if printf '%s' "$DEVICE_OUTPUT" | grep -qF 'no raw capture for iphone/en/light/never-captured-1'; then
    pass 'an uncaptured scene is reported and skipped'
else
    echo "FAIL an uncaptured scene is reported and skipped"
    FAILURES=$((FAILURES + 1))
fi

assert_equals 'framed iPhone output keeps the capture pixel size' \
    "$(dimensions_of "$OUT_DIR/home/en/light/home-hero-1@2x.png")" '1320x2868'
assert_equals 'framed iPad output keeps the capture pixel size' \
    "$(dimensions_of "$OUT_DIR/home/en/light/home-hero-1-ipad@2x.png")" '2064x2752'
assert_equals 'the framed output carries an alpha channel (no opaque plate)' \
    "$(magick identify -format "%A" "$OUT_DIR/home/en/light/home-hero-1@2x.png")" 'Blend'
assert_equals 'the background outside the frame is transparent (no plate)' \
    "$(alpha_at "$OUT_DIR/home/en/light/home-hero-1@2x.png" 0 0)" '0'
assert_equals 'the bottom edge is transparent too (no caption band)' \
    "$(alpha_at "$OUT_DIR/home/en/light/home-hero-1@2x.png" 660 2867)" '0'
assert_equals 'the device itself is opaque' \
    "$(alpha_at "$OUT_DIR/home/en/light/home-hero-1@2x.png" 660 1434)" '1'

RAW_OUT_DIR="$WORK_DIR/media-raw"
HOME="$WORK_DIR/no-frameit" bash "$TARGET" en light --frame raw \
    --groups "$GROUPS_MAP" --raw-dir "$RAW_DIR" --output "$RAW_OUT_DIR" >/dev/null 2>&1

assert_file 'raw mode writes the unframed crop' "$RAW_OUT_DIR/home/en/light/home-hero-1@2x.png"
assert_equals 'raw mode keeps the capture pixel size' \
    "$(dimensions_of "$RAW_OUT_DIR/home/en/light/home-hero-1@2x.png")" '1320x2868'
assert_equals 'raw mode rounds the corners' \
    "$(alpha_at "$RAW_OUT_DIR/home/en/light/home-hero-1@2x.png" 0 0)" '0'
assert_equals 'raw mode keeps the body opaque' \
    "$(alpha_at "$RAW_OUT_DIR/home/en/light/home-hero-1@2x.png" 660 1434)" '1'

SQUARE_OUT_DIR="$WORK_DIR/media-square"
HOME="$WORK_DIR/no-frameit" bash "$TARGET" en light --frame raw --radius 0 \
    --groups "$GROUPS_MAP" --raw-dir "$RAW_DIR" --output "$SQUARE_OUT_DIR" >/dev/null 2>&1
assert_equals '--radius 0 keeps square corners' \
    "$(alpha_at "$SQUARE_OUT_DIR/home/en/light/home-hero-1@2x.png" 0 0)" '1'

SCENE_OUT_DIR="$WORK_DIR/media-scene"
HOME="$FAKE_HOME" bash "$TARGET" en light --scenes pin-app-lock-1 --device iphone \
    --groups "$GROUPS_MAP" --raw-dir "$RAW_DIR" --output "$SCENE_OUT_DIR" >/dev/null 2>&1
assert_file '--scenes composes the selected scene' "$SCENE_OUT_DIR/pin-app-lock/en/light/pin-app-lock-1@2x.png"
assert_no_file '--scenes skips everything else' "$SCENE_OUT_DIR/home/en/light/home-hero-1@2x.png"

assert_fails 'an unknown argument fails closed' \
    env HOME="$FAKE_HOME" bash "$TARGET" en light --nope
assert_fails 'an unknown frame mode fails closed' \
    env HOME="$FAKE_HOME" bash "$TARGET" en light --frame plate --groups "$GROUPS_MAP" --raw-dir "$RAW_DIR" --output "$WORK_DIR/never"
assert_fails 'an option in the positional slot fails closed' \
    env HOME="$FAKE_HOME" bash "$TARGET" --frame raw
assert_fails 'a run that composes nothing fails closed' \
    env HOME="$FAKE_HOME" bash "$TARGET" en light --groups "$GROUPS_MAP" --raw-dir "$WORK_DIR/empty-raw" --output "$WORK_DIR/never"
assert_fails 'a missing frameit cache fails closed in device mode' \
    env HOME="$WORK_DIR/no-frameit" bash "$TARGET" en light --groups "$GROUPS_MAP" --raw-dir "$RAW_DIR" --output "$WORK_DIR/never"

if [ "$FAILURES" -eq 0 ]; then
    echo "test-compose-web-media: all checks passed"

    exit 0
fi

echo "test-compose-web-media: $FAILURES check(s) failed" >&2

exit 1

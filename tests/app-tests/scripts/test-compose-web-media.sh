#!/bin/bash
# Verifies compose-web-media.sh composes iPhone captures into AVIF+WebP at the derived route slug, at the fixed 900x1955 landing contract size.
set -euo pipefail
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
TARGET="$REPO_ROOT/packages/app/fastlane/screenshots/design/compose-web-media.sh"

command -v magick >/dev/null 2>&1 || {
    echo "skip test-compose-web-media: ImageMagick 7 ('magick') is not installed"
    exit 0
}

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
FAILURES=0

assert_equals() {
    local label="$1" actual="$2" expected="$3"
    if [ "$actual" = "$expected" ]; then
        echo "ok   $label"
    else
        echo "FAIL $label: expected '$expected', got '$actual'"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_file() {
    local label="$1" path="$2"
    if [ -f "$path" ]; then
        echo "ok   $label"
    else
        echo "FAIL $label: no file at $path"
        FAILURES=$((FAILURES + 1))
    fi
}

synthesize_frame() {
    local out="$1" frame_w="$2" frame_h="$3" cut_x="$4" cut_y="$5" cut_w="$6" cut_h="$7"
    local mask="$WORK_DIR/frame-mask.png"
    magick -size "${frame_w}x${frame_h}" xc:white -fill black \
        -draw "rectangle ${cut_x},${cut_y} $((cut_x + cut_w - 1)),$((cut_y + cut_h - 1))" -alpha off "$mask"
    magick -size "${frame_w}x${frame_h}" xc:'#1A1A1A' "$mask" -alpha off -compose CopyOpacity -composite -define png:color-type=6 "$out"
}

FAKE_HOME="$WORK_DIR/home"
FRAMES_DIR="$FAKE_HOME/.fastlane/frameit/latest"
mkdir -p "$FRAMES_DIR"
synthesize_frame "$FRAMES_DIR/Apple iPhone 16 Pro Max Black Titanium.png" 1470 3000 75 66 1320 2868
synthesize_frame "$FRAMES_DIR/Apple iPad Pro (12.9-inch) (4th generation) Space Gray.png" 2245 2930 96 102 2048 2732

RAW_DIR="$WORK_DIR/raw"
mkdir -p "$RAW_DIR/ios/iphone-17-pro-max/en/light"
magick -size 1320x2868 gradient:'#3366FF-#FFFFFF' -alpha off "$RAW_DIR/ios/iphone-17-pro-max/en/light/home-hero-1.png"
OUT_DIR="$WORK_DIR/media"
HOME="$FAKE_HOME" bash "$TARGET" --raw-dir "$RAW_DIR" --output "$OUT_DIR" > "$WORK_DIR/compose.log" 2>&1 || {
    echo "FAIL compose-web-media.sh exited non-zero:"
    cat "$WORK_DIR/compose.log"
    exit 1
}
AVIF_OUT="$OUT_DIR/home-hero/en/light/home-hero-1@2x.avif"
WEBP_OUT="$OUT_DIR/home-hero/en/light/home-hero-1@2x.webp"
assert_file 'the trailing -<n> is stripped to derive the route slug' "$AVIF_OUT"
assert_file 'webp ships alongside avif' "$WEBP_OUT"
assert_equals 'output is the landing contract 900x1955 size' "$(magick identify -format "%wx%h" "$AVIF_OUT")" '900x1955'
assert_equals 'the webp copy matches the same fixed size' "$(magick identify -format "%wx%h" "$WEBP_OUT")" '900x1955'

if HOME="$FAKE_HOME" bash "$TARGET" --raw-dir "$WORK_DIR/empty-raw" --output "$WORK_DIR/never" >/dev/null 2>&1; then
    echo "FAIL an empty raw tree should exit non-zero"
    FAILURES=$((FAILURES + 1))
else
    echo "ok   an empty raw tree exits non-zero"
fi

if [ "$FAILURES" -eq 0 ]; then
    echo "test-compose-web-media: all checks passed"
    exit 0
fi
echo "test-compose-web-media: $FAILURES check(s) failed" >&2
exit 1

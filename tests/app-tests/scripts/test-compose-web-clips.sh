#!/bin/bash
# Verifies compose-web-clips.sh encodes raw Maestro clips into webm+mp4+poster at the derived route slug.
set -euo pipefail
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
TARGET="$REPO_ROOT/packages/app/fastlane/screenshots/design/compose-web-clips.sh"

command -v ffmpeg >/dev/null 2>&1 || {
    echo "skip test-compose-web-clips: 'ffmpeg' is not installed"
    exit 0
}
command -v magick >/dev/null 2>&1 || {
    echo "skip test-compose-web-clips: ImageMagick 7 ('magick') is not installed"
    exit 0
}

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
FAILURES=0

assert_file() {
    local label="$1" path="$2"
    if [ -f "$path" ]; then
        echo "ok   $label"
    else
        echo "FAIL $label: no file at $path"
        FAILURES=$((FAILURES + 1))
    fi
}

RAW_DIR="$WORK_DIR/raw/ios/iphone-17-pro-max/en/light"
mkdir -p "$RAW_DIR"
ffmpeg -hide_banner -loglevel error -y -f lavfi -i testsrc=size=1320x2868:duration=1:rate=10 \
    -pix_fmt yuv420p "$RAW_DIR/voice-transaction-entry-clip-1.mp4"
magick -size 1320x2868 xc:'#3366FF' "$RAW_DIR/voice-transaction-entry-clip-1.png"

OUT_DIR="$WORK_DIR/media"
bash "$TARGET" --raw-dir "$WORK_DIR/raw" --output "$OUT_DIR" > "$WORK_DIR/compose.log" 2>&1 || {
    echo "FAIL compose-web-clips.sh exited non-zero:"
    cat "$WORK_DIR/compose.log"
    exit 1
}
DEST="$OUT_DIR/voice-transaction-entry/en/light"
assert_file 'the -clip-<n> segment strips to the route slug (webm)' "$DEST/voice-transaction-entry-clip-1.webm"
assert_file 'the -clip-<n> segment strips to the route slug (mp4)' "$DEST/voice-transaction-entry-clip-1.mp4"
assert_file 'the -clip-<n> segment strips to the route slug (poster)' "$DEST/voice-transaction-entry-clip-1-poster.webp"

NO_POSTER_RAW="$WORK_DIR/raw-no-poster/ios/iphone-17-pro-max/en/light"
mkdir -p "$NO_POSTER_RAW"
cp "$RAW_DIR/voice-transaction-entry-clip-1.mp4" "$NO_POSTER_RAW/voice-transaction-entry-clip-1.mp4"
if bash "$TARGET" --raw-dir "$WORK_DIR/raw-no-poster" --output "$WORK_DIR/never" >/dev/null 2>&1; then
    echo "FAIL a clip with no poster PNG should exit non-zero"
    FAILURES=$((FAILURES + 1))
else
    echo "ok   a clip with no poster PNG exits non-zero"
fi

if [ "$FAILURES" -eq 0 ]; then
    echo "test-compose-web-clips: all checks passed"
    exit 0
fi
echo "test-compose-web-clips: $FAILURES check(s) failed" >&2
exit 1

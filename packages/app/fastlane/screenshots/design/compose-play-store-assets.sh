#!/usr/bin/env bash
# Generates the Play Store feature graphic and hi-res icon from the app's own icon mark; see README.md "Play asset list".
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$DESIGN_DIR/../../.." && pwd)"
OUTPUT_DIR="$APP_DIR/fastlane/metadata/android/en-US/images"
ICON_SOURCE="$APP_DIR/assets/icons/ios-light.png"
GRAPHIC_SOURCE="$APP_DIR/assets/icons/ios-dark.png"

FEATURE_GRAPHIC_WIDTH=1024
FEATURE_GRAPHIC_HEIGHT=500
FEATURE_GRAPHIC_GLYPH_HEIGHT_FRACTION='0.58'
BACKGROUND_TOP_HEX='#141414'
BACKGROUND_BOTTOM_HEX='#0A0A0A'

ICON_SIZE=512

if ! command -v magick >/dev/null 2>&1; then
    echo "error: ImageMagick 7 ('magick') is required on PATH" >&2
    exit 1
fi
if [[ ! -f "$ICON_SOURCE" || ! -f "$GRAPHIC_SOURCE" ]]; then
    echo "error: source icons not found at $ICON_SOURCE or $GRAPHIC_SOURCE" >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/budgie-play-assets.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT

magick "$ICON_SOURCE" -resize "${ICON_SIZE}x${ICON_SIZE}" \
    -define png:color-type=6 -depth 8 "$OUTPUT_DIR/icon.png"

magick "$GRAPHIC_SOURCE" -fuzz 8% -transparent black -trim +repage "$WORK_DIR/glyph.png"

glyph_height=$(awk -v h="$FEATURE_GRAPHIC_HEIGHT" -v f="$FEATURE_GRAPHIC_GLYPH_HEIGHT_FRACTION" 'BEGIN { printf "%d", h * f }')

magick -size "${FEATURE_GRAPHIC_WIDTH}x${FEATURE_GRAPHIC_HEIGHT}" \
    "gradient:${BACKGROUND_TOP_HEX}-${BACKGROUND_BOTTOM_HEX}" \
    \( "$WORK_DIR/glyph.png" -resize "x${glyph_height}" \) -gravity center -compose Over -composite \
    -alpha off -define png:color-type=2 -depth 8 "$OUTPUT_DIR/featureGraphic.png"

echo "wrote $OUTPUT_DIR/icon.png and $OUTPUT_DIR/featureGraphic.png"

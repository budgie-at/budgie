#!/usr/bin/env bash
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DESIGN_DIR/../../../../.." && pwd)"
MEDIA_ROOT="$REPO_ROOT/packages/landing/public/media"
OUTPUT_ROOT="${HEADER_OUTPUT_DIR:-$DESIGN_DIR/../marketing/headers}"
FONT="$REPO_ROOT/packages/app/assets/fonts/FixelDisplay-Bold.ttf"
WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-headers.XXXXXX")"
trap 'rm -rf "$WORK_ROOT"' EXIT

command -v magick >/dev/null
source "$DESIGN_DIR/frame-device.sh"

for locale in en-US de-DE es-ES fr-FR uk; do
    app_locale="$(raw_locale_for "$locale")"
    home="$MEDIA_ROOT/net-worth-tracker/$app_locale/dark/net-worth-tracker-1@2x.webp"
    analytics="$MEDIA_ROOT/spending-analytics/$app_locale/dark/spending-analytics-1@2x.webp"
    for source_image in "$home" "$analytics"; do
        if [[ ! -f "$source_image" ]]; then
            echo "error: missing framed source $source_image" >&2
            exit 1
        fi
    done

    magick "$REPO_ROOT/packages/app/assets/icons/ios-dark.png" \
        -fuzz 8% -transparent black -trim +repage -resize x420 "$WORK_ROOT/mark.png"
    magick -background none -fill white -font "$FONT" -pointsize 260 \
        -kerning -6 label:Budgie "$WORK_ROOT/wordmark.png"
    magick "$home" -trim +repage -resize x1820 "$WORK_ROOT/home.png"
    magick "$analytics" -trim +repage -resize x1580 "$WORK_ROOT/analytics.png"
    magick -size 5244x2950 'gradient:#003B25-#00140C' \
        \( -size 3200x2600 'radial-gradient:rgba(0,119,80,0.55)-rgba(0,119,80,0)' \) \
        -geometry +1600+100 -compose Over -composite \
        "$WORK_ROOT/mark.png" -geometry +1110+1000 -compose Over -composite \
        "$WORK_ROOT/wordmark.png" -geometry +900+1500 -compose Over -composite \
        "$WORK_ROOT/analytics.png" -geometry +3400+810 -compose Over -composite \
        "$WORK_ROOT/home.png" -geometry +2380+570 -compose Over -composite \
        -alpha off -colorspace sRGB -depth 8 -strip \
        -define png:color-type=2 -define png:exclude-chunk=date,time \
        "$WORK_ROOT/universal.png"

    mkdir -p "$OUTPUT_ROOT/$locale"
    cp "$WORK_ROOT/universal.png" "$OUTPUT_ROOT/$locale/header-universal-5244x2950.png"
    magick "$WORK_ROOT/universal.png" -crop 5244x2248+0+351 +repage \
        -resize 3840x1646! -alpha off -depth 8 -strip -define png:color-type=2 \
        -define png:exclude-chunk=date,time "$OUTPUT_ROOT/$locale/header-3840x1646.png"
    echo "wrote $OUTPUT_ROOT/$locale"
done

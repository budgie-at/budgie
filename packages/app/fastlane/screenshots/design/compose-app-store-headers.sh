#!/usr/bin/env bash
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DESIGN_DIR/../../../../.." && pwd)"
SCREENSHOTS_ROOT="$DESIGN_DIR/../variants/dark/ios"
MEDIA_ROOT="$REPO_ROOT/packages/landing/public/media"
OUTPUT_ROOT="${HEADER_OUTPUT_DIR:-$DESIGN_DIR/../marketing/headers}"
FONT="$REPO_ROOT/packages/app/assets/fonts/FixelDisplay-Bold.ttf"
SUBLINE_FONT="$REPO_ROOT/packages/app/assets/fonts/FixelDisplay-SemiBold.ttf"
WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-headers.XXXXXX")"
trap 'rm -rf "$WORK_ROOT"' EXIT

command -v magick >/dev/null
source "$DESIGN_DIR/frame-device.sh"

render_text() {
    local text="$1" pointsize="$2" width="$3" fill="$4" output="$5"
    magick -background none -fill "$fill" -font "$FONT" -pointsize "$pointsize" \
        -kerning -2 label:"$text" -trim +repage "$output"
    if (( $(magick identify -format '%w' "$output") > width )); then
        magick "$output" -resize "${width}x" "$output"
    fi
}

for locale in en-US de-DE es-ES fr-FR uk; do
    case "$locale" in
        en-US)
            headline='See where money goes.'
            headline_first='See where'
            headline_second='money goes.'
            support='Offline · No sign-up · No subscription'
            ;;
        de-DE)
            headline='Verstehe deine Ausgaben.'
            headline_first='Verstehe deine'
            headline_second='Ausgaben.'
            support='Offline · Ohne Anmeldung · Ohne Abo'
            ;;
        es-ES)
            headline='Descubre en qué gastas.'
            headline_first='Descubre'
            headline_second='en qué gastas.'
            support='Sin conexión · Sin cuenta · Sin suscripción'
            ;;
        fr-FR)
            headline='Comprenez vos dépenses.'
            headline_first='Comprenez'
            headline_second='vos dépenses.'
            support='Hors ligne · Sans compte · Sans abonnement'
            ;;
        uk)
            headline='Знайте, куди йдуть гроші.'
            headline_first='Знайте, куди'
            headline_second='йдуть гроші.'
            support='Офлайн · Без реєстрації · Без підписки'
            ;;
    esac
    app_locale="$(raw_locale_for "$locale")"
    home="$SCREENSHOTS_ROOT/$locale/01_iphone_home.png"
    analytics="$MEDIA_ROOT/spending-analytics/$app_locale/dark/spending-analytics-1@2x.webp"
    for source_image in "$home" "$analytics" "$FONT" "$SUBLINE_FONT"; do
        if [[ ! -f "$source_image" ]]; then
            echo "error: missing header source $source_image" >&2
            exit 1
        fi
    done

    magick "$home" -crop 1216x2018+52+850 +repage "$WORK_ROOT/home-crop.png"
    magick "$WORK_ROOT/home-crop.png" \
        -fx '(g > r*1.4 && g > b*1.2) ? 0 : 1' \
        -fill 'gray(50%)' -draw 'color 0,0 floodfill' \
        -fx 'abs(u-0.5) < 0.01 ? 0 : 1' "$WORK_ROOT/home-mask.png"
    magick "$WORK_ROOT/home-crop.png" "$WORK_ROOT/home-mask.png" \
        -alpha off -compose CopyOpacity -composite -trim +repage "$WORK_ROOT/home.png"
    magick "$REPO_ROOT/packages/app/assets/icons/ios-dark.png" \
        -fuzz 8% -transparent black -trim +repage -resize x250 "$WORK_ROOT/mark.png"
    render_text Budgie 210 900 white "$WORK_ROOT/wordmark.png"
    magick "$WORK_ROOT/home.png" -resize 1350x "$WORK_ROOT/hero-universal.png"
    magick "$WORK_ROOT/hero-universal.png" -channel A \
        -fx 'u * min(1,(h-1-j)/300)' +channel "$WORK_ROOT/hero-universal.png"
    magick "$analytics" -trim +repage -resize x2600 -background none -rotate 8 "$WORK_ROOT/analytics-universal.png"
    render_text "$headline" 145 1310 '#54EAA6' "$WORK_ROOT/headline-universal.png"
    magick -size 5244x2950 'gradient:#003B25-#00140C' \
        \( -size 4200x3400 'radial-gradient:rgba(0,119,80,0.55)-rgba(0,119,80,0)' \) \
        -geometry +1000+0 -compose Over -composite \
        "$WORK_ROOT/analytics-universal.png" -geometry +3070+150 -compose Over -composite \
        "$WORK_ROOT/hero-universal.png" -geometry +1940+320 -compose Over -composite \
        \( -size 5244x480 'gradient:rgba(0,20,12,0)-#00140C' \) \
        -geometry +0+2470 -compose Over -composite \
        -fill 'rgba(0,32,20,0.98)' -draw 'rectangle 1880,1450 3375,1650' \
        "$WORK_ROOT/headline-universal.png" -geometry +1960+1480 -compose Over -composite \
        "$WORK_ROOT/mark.png" -geometry +940+970 -compose Over -composite \
        "$WORK_ROOT/wordmark.png" -geometry +750+1300 -compose Over -composite \
        -alpha off -colorspace sRGB -depth 8 -strip \
        -define png:color-type=2 -define png:exclude-chunk=date,time \
        "$WORK_ROOT/universal.png"

    magick "$WORK_ROOT/home.png" -resize 900x "$WORK_ROOT/hero-wide.png"
    magick "$analytics" -trim +repage -resize x1550 -background none -rotate 8 "$WORK_ROOT/analytics-wide.png"
    magick "$WORK_ROOT/mark.png" -resize x75 "$WORK_ROOT/mark-wide.png"
    render_text Budgie 80 400 white "$WORK_ROOT/wordmark-wide.png"
    render_text "$headline_first" 120 690 white "$WORK_ROOT/headline-first.png"
    render_text "$headline_second" 120 690 '#54EAA6' "$WORK_ROOT/headline-second.png"
    magick -background none -fill '#DFFBEE' -font "$SUBLINE_FONT" -pointsize 34 \
        label:"$support" -trim +repage -resize '690x>' "$WORK_ROOT/support.png"
    magick -size 3840x1646 'gradient:#003B25-#00140C' \
        \( -size 2800x2200 'radial-gradient:rgba(0,119,80,0.55)-rgba(0,119,80,0)' \) \
        -geometry +1000+0 -compose Over -composite \
        "$WORK_ROOT/analytics-wide.png" -geometry +2630+170 -compose Over -composite \
        "$WORK_ROOT/hero-wide.png" -geometry +1850+270 -compose Over -composite \
        "$WORK_ROOT/mark-wide.png" -geometry +1125+510 -compose Over -composite \
        "$WORK_ROOT/wordmark-wide.png" -geometry +1230+510 -compose Over -composite \
        "$WORK_ROOT/headline-first.png" -geometry +1125+670 -compose Over -composite \
        "$WORK_ROOT/headline-second.png" -geometry +1125+800 -compose Over -composite \
        "$WORK_ROOT/support.png" -geometry +1125+1000 -compose Over -composite \
        -alpha off -colorspace sRGB -depth 8 -strip \
        -define png:color-type=2 -define png:exclude-chunk=date,time \
        "$WORK_ROOT/wide.png"

    mkdir -p "$OUTPUT_ROOT/$locale"
    cp "$WORK_ROOT/universal.png" "$OUTPUT_ROOT/$locale/header-universal-5244x2950.png"
    cp "$WORK_ROOT/wide.png" "$OUTPUT_ROOT/$locale/header-3840x1646.png"
    echo "wrote $OUTPUT_ROOT/$locale"
done

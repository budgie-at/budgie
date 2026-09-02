#!/usr/bin/env bash
#
# Compose framed, captioned App Store screenshots with ImageMagick 7, using
# fastlane frameit's real device frame PNGs (Apple Design Resources, via
# facebook/design) rather than a hand-drawn rounded rectangle.
#
# `deliver` assigns App Store Connect screenshot slots by matching the *exact*
# pixel dimensions of the uploaded file, and frameit's own `run`/`ios` commands
# letterbox every capture into a single fixed canvas, so frameit's pipeline
# cannot be used unmodified. This script borrows frameit's downloaded frame
# assets directly instead: each raw capture is composited into the frame PNG's
# own transparent screen cutout (so the frame's real bezel, not a synthetic
# radius, covers the capture's square corners), then scaled onto a canvas of the
# exact same resolution as the raw capture, over a variant-palette background,
# with a two-tier headline/descriptor caption stack and a soft drop shadow.
#
# One-time setup - download the frame assets (cached at ~/.fastlane/frameit):
#
#   fastlane frameit download_frames
#
# Usage:
#   packages/app/fastlane/screenshots/design/compose-screenshots.sh \
#       <asc-locale|all> <light|dark|all> [--device iphone|ipad|all]
#
# `asc-locale` is an App Store Connect locale folder (en-US, fr-FR, uk, de-DE,
# es-ES) and must have design/<asc-locale>/title.strings and subtitle.strings.
# Raw captures are read from the layout mobile-ci's capture-screenshots-ios
# action and scripts/capture-store-screenshots.sh both write:
#
#   ../raw/ios/<device-slug>/<app-locale>/<appearance>/<scene>.png
#
# Composed sets are published to ../variants/<appearance>/ios/<asc-locale>.
#
# CAPTION_FONT overrides the caption typeface; it defaults to the app's own
# FixelDisplay Bold TTF, which is in-repo and therefore renders identically on
# macOS and Linux without depending on either OS's installed font set.
#
# SCREENSHOTS_RAW_DIR overrides where raw captures are read from, and
# PUBLISH_VARIANT_NAME overrides the variants/<name> directory the composed set
# is published to. The Fastfile's ios_screenshots lane uses both to compose CI's
# downloaded captures into variants/ci without touching the committed sets.
# PUBLISH_VARIANT_NAME pins one output directory, so it cannot be combined with
# the `all` appearance argument - both appearances would publish into the same
# directory and the second would replace the first.
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# frameit cache lookup, device frame geometry, the ASC -> app locale mapping and
# the capture-into-cutout step are shared with compose-web-media.sh.
# shellcheck source=./frame-device.sh
source "$DESIGN_DIR/frame-device.sh"
SCREENSHOTS_DIR="$(cd "$DESIGN_DIR/.." && pwd)"
APP_DIR="$(cd "$SCREENSHOTS_DIR/../.." && pwd)"
RAW_DIR="${SCREENSHOTS_RAW_DIR:-$SCREENSHOTS_DIR/raw}/ios"
FONT="${CAPTION_FONT:-$APP_DIR/assets/fonts/FixelDisplay-Bold.ttf}"

LOCALE_ARGUMENT="${1:-en-US}"
VARIANT_ARGUMENT="${2:-all}"
DEVICE_ARGUMENT='all'
if [[ "${3:-}" == "--device" ]]; then
    DEVICE_ARGUMENT="${4:-all}"
elif [[ -n "${3:-}" ]]; then
    echo "error: unknown argument '${3}'. Use --device iphone|ipad|all." >&2
    exit 1
fi

case "$VARIANT_ARGUMENT" in
    light | dark | all) ;;
    *)
        echo "error: unknown variant '$VARIANT_ARGUMENT'. Use light, dark, or all." >&2
        exit 1
        ;;
esac
case "$DEVICE_ARGUMENT" in
    iphone | ipad | all) ;;
    *)
        echo "error: unknown device '$DEVICE_ARGUMENT'. Use iphone, ipad, or all." >&2
        exit 1
        ;;
esac

# publish_stage clears the destination before moving the staged set in, so a
# pinned PUBLISH_VARIANT_NAME plus `all` would compose light, publish it, then
# compose dark and wipe it - silently shipping one appearance twice.
if [[ -n "${PUBLISH_VARIANT_NAME:-}" && "$VARIANT_ARGUMENT" == "all" ]]; then
    echo "error: PUBLISH_VARIANT_NAME ('$PUBLISH_VARIANT_NAME') publishes every appearance into variants/$PUBLISH_VARIANT_NAME, so it cannot be combined with the 'all' appearance argument - light and dark would overwrite each other. Pass light or dark." >&2
    exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
    echo "error: ImageMagick 7 ('magick') is required on PATH" >&2
    exit 1
fi
if [[ ! -f "$FONT" ]]; then
    echo "error: caption font not found at $FONT (override with CAPTION_FONT)" >&2
    exit 1
fi

ALL_LOCALES=(en-US fr-FR uk de-DE es-ES)
SELECTED_LOCALES=()
if [[ "$LOCALE_ARGUMENT" == "all" ]]; then
    SELECTED_LOCALES=("${ALL_LOCALES[@]}")
else
    SELECTED_LOCALES=("$LOCALE_ARGUMENT")
fi

resolve_frameit_frames_dir
resolve_device_frames

# --- Design system constants - see README.md "Design system". ---------------

# Near-flat canvas with an almost imperceptible top-to-bottom tone shift instead
# of a pure solid fill: reads as flat at a glance (a real gradient would fight
# Budgie's monochrome brand) but keeps the canvas from looking like a dead
# printer-paper swatch next to the device shadow. The two palettes are the app's
# own secondary background and primary text tokens from src/global.css.
set_variant_palette() {
    if [[ "$1" == "dark" ]]; then
        BACKGROUND_TOP_HEX='#141414'
        BACKGROUND_BOTTOM_HEX='#0A0A0A'
        TEXT_HEX='#F5F5F5'
        DESCRIPTOR_RGB='245,245,245'
    else
        BACKGROUND_TOP_HEX='#F8F8F8'
        BACKGROUND_BOTTOM_HEX='#F1F1F1'
        TEXT_HEX='#0A0A0A'
        DESCRIPTOR_RGB='10,10,10'
    fi
}

# Headline point size targets 10% of an "effective width" rather than the raw
# canvas width, so both devices are calibrated to the same proportion of their
# own vertical budget. The iPhone's 1320x2868 canvas is already at the reference
# aspect, so its effective width is its own width; the much wider iPad canvas
# clamps down to its height rescaled to that reference aspect, which keeps its
# headline from swallowing the shallow band left around the device.
REFERENCE_ASPECT_W_OVER_H='0.46003051'
HEADLINE_POINTSIZE_FRACTION='0.10'
HEADLINE_MIN_FRACTION='0.55'
HEADLINE_TARGET_WIDTH_FRACTION='0.90'
HEADLINE_SHRINK_STEP=4
DESCRIPTOR_SIZE_RATIO='0.55'
DESCRIPTOR_OPACITY='0.75'

STACK_GAP_FRACTION='0.012'

# Vertical gap between the caption stack and the device frame - deliberately
# tight so the composition reads as one cohesive unit instead of a
# caption-island floating above a separate device-island. Both layout variants
# place the device relative to the caption stack's actual rendered height rather
# than anchoring text and device to opposite canvas edges and letting whatever
# is left over become the gap.
TEXT_EDGE_MARGIN_FRACTION='0.05'
TEXT_DEVICE_GAP_FRACTION='0.016'

DEVICE_HEIGHT_FRACTION_DEFAULT='0.74'
DEVICE_HEIGHT_FRACTION_ENDPOINT='0.78'

# Soft drop shadow under the framed device - black, low opacity, blurred, offset
# down. Ratios are relative to canvas height so both devices get a
# proportionally identical shadow.
SHADOW_OPACITY='0.15'
SHADOW_BLUR_RATIO='0.01335'
SHADOW_OFFSET_RATIO='0.00953'

WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-compose-work.XXXXXX")"
# Every scene composes into a staging directory and the published set is only
# replaced once the whole variant succeeded. `set -e` aborts on the first
# ImageMagick failure, so clearing the output directory up front and composing
# into it in place would destroy a good set and leave nothing behind.
STAGE_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-compose-stage.XXXXXX")"
trap 'rm -rf "$WORK_ROOT" "$STAGE_ROOT"' EXIT

OUT_DIR=''

publish_stage() {
    local final_dir="$1" staged_count
    staged_count="$(find "$OUT_DIR" -maxdepth 1 -name '*.png' | wc -l | tr -d ' ')"
    if [[ "$staged_count" == "0" ]]; then
        echo "error: nothing composed for $final_dir, keeping the published set" >&2
        exit 1
    fi

    mkdir -p "$final_dir"
    rm -f "$final_dir"/*.png
    mv "$OUT_DIR"/*.png "$final_dir/"
    echo "published $staged_count screenshots to $final_dir"
}

string_for() {
    local file="$1" scene="$2" label="$3" line
    line="$(grep -F "\"$scene\" = " "$file" || true)"
    if [[ -z "$line" ]]; then
        echo "error: no $label for scene '$scene' in $file" >&2
        exit 1
    fi
    echo "$line" | sed -E 's/^"[^"]+" = "(.*)";$/\1/'
}

# Renders `text` at `pointsize` as an unwrapped label and prints its pixel
# width - used by fit_headline_pointsize's shrink-to-fit loop.
label_width() {
    magick -font "$FONT" -pointsize "$1" label:"$2" -format "%w" info:
}

# Shrinks the headline point size in fixed steps until it fits inside 90% of the
# canvas width, never going below 60% of the starting (max) point size.
fit_headline_pointsize() {
    local effective_w="$1" canvas_w="$2" text="$3"
    local max_pt min_pt target_w pt width
    max_pt=$(awk -v w="$effective_w" -v f="$HEADLINE_POINTSIZE_FRACTION" 'BEGIN { printf "%d", w * f }')
    min_pt=$(awk -v m="$max_pt" -v f="$HEADLINE_MIN_FRACTION" 'BEGIN { printf "%d", m * f }')
    target_w=$(awk -v w="$canvas_w" -v f="$HEADLINE_TARGET_WIDTH_FRACTION" 'BEGIN { printf "%d", w * f }')
    pt="$max_pt"
    width="$(label_width "$pt" "$text")"
    while ((width > target_w && pt > min_pt)); do
        pt=$((pt - HEADLINE_SHRINK_STEP))
        if ((pt < min_pt)); then
            pt=$min_pt
        fi
        width="$(label_width "$pt" "$text")"
    done
    echo "$pt"
}

# Builds the black, blurred, low-opacity shadow silhouette of a
# transparent-canvas image (same pixel dimensions in and out) and shifts it down
# by the configured offset, ready to composite onto the background before the
# device itself.
build_shadow() {
    local device_on_canvas="$1" canvas_w="$2" canvas_h="$3" out="$4"
    local blur offset silhouette
    blur=$(awk -v h="$canvas_h" -v r="$SHADOW_BLUR_RATIO" 'BEGIN { printf "%d", h * r }')
    offset=$(awk -v h="$canvas_h" -v r="$SHADOW_OFFSET_RATIO" 'BEGIN { printf "%d", h * r }')
    silhouette="$WORK_ROOT/shadow-silhouette-$$-$RANDOM.png"
    magick "$device_on_canvas" -fill black -colorize 100% \
        -channel A -evaluate multiply "$SHADOW_OPACITY" +channel \
        -channel A -blur "0x${blur}" +channel \
        -define png:color-type=6 -depth 8 "$silhouette"
    magick -size "${canvas_w}x${canvas_h}" xc:none "$silhouette" \
        -gravity NorthWest -geometry "+0+${offset}" -compose Over -composite \
        -define png:color-type=6 -depth 8 "$out"
    rm -f "$silhouette"
}

# Builds the two-tier caption stack (headline, descriptor) as one transparent
# PNG, exactly as tall as its rendered content, so the device can be placed
# directly beneath or above it with a fixed, tight gap instead of being centred
# in a fixed box.
build_text_stack() {
    local canvas_w="$1" canvas_h="$2" headline="$3" descriptor="$4" out="$5"
    local effective_w headline_pt descriptor_pt cap_w
    local headline_png descriptor_png headline_w headline_h descriptor_h
    local sub_gap descriptor_y stack_h

    effective_w=$(awk -v w="$canvas_w" -v h="$canvas_h" -v a="$REFERENCE_ASPECT_W_OVER_H" \
        'BEGIN { aspect_w = h * a; printf "%d", (aspect_w < w ? aspect_w : w) }')

    headline_pt="$(fit_headline_pointsize "$effective_w" "$canvas_w" "$headline")"
    descriptor_pt=$(awk -v p="$headline_pt" -v r="$DESCRIPTOR_SIZE_RATIO" 'BEGIN { printf "%d", p * r }')
    cap_w=$(awk -v w="$canvas_w" -v f="$HEADLINE_TARGET_WIDTH_FRACTION" 'BEGIN { printf "%d", w * f }')

    headline_png="$WORK_ROOT/headline-$$-$RANDOM.png"
    magick -background none -fill "$TEXT_HEX" -font "$FONT" -pointsize "$headline_pt" \
        label:"$headline" -trim +repage -define png:color-type=6 -depth 8 "$headline_png"

    # The shrink-to-fit loop stops at the minimum point size, so a headline long
    # enough to still overflow there would render past the canvas edge and be
    # clipped on publish. Clamp it to the caption width instead - the note is
    # the signal to shorten the copy rather than ship a mismatched type size.
    headline_w="$(magick identify -format "%w" "$headline_png")"
    if ((headline_w > cap_w)); then
        echo "note: headline \"$headline\" is ${headline_w}px at its minimum point size, wider than the ${cap_w}px caption width; scaling it down - shorten the copy" >&2
        magick "$headline_png" -resize "${cap_w}x" -define png:color-type=6 -depth 8 "$headline_png"
    fi
    headline_h="$(magick identify -format "%h" "$headline_png")"

    descriptor_png="$WORK_ROOT/descriptor-$$-$RANDOM.png"
    magick -background none -fill "rgba(${DESCRIPTOR_RGB},${DESCRIPTOR_OPACITY})" -font "$FONT" \
        -pointsize "$descriptor_pt" -gravity center -size "${cap_w}x" caption:"$descriptor" \
        -trim +repage -define png:color-type=6 -depth 8 "$descriptor_png"
    descriptor_h="$(magick identify -format "%h" "$descriptor_png")"

    sub_gap=$(awk -v h="$canvas_h" -v f="$STACK_GAP_FRACTION" 'BEGIN { printf "%d", h * f }')
    if ((sub_gap < 2)); then
        sub_gap=2
    fi

    descriptor_y=$((headline_h + sub_gap))
    stack_h=$((descriptor_y + descriptor_h))

    magick -size "${cap_w}x${stack_h}" xc:none \
        "$headline_png" -gravity North -geometry "+0+0" -compose Over -composite \
        "$descriptor_png" -gravity North -geometry "+0+${descriptor_y}" -compose Over -composite \
        -define png:color-type=6 -depth 8 "$out"

    rm -f "$headline_png" "$descriptor_png"
}

# Given the layout variant and the rendered heights of the caption stack and the
# device block, prints "device_y text_y" as absolute North-anchored offsets.
# Layout A is text-top/device-bottom: the text sits at the fixed outer edge
# margin and the device starts immediately after it. Layout B mirrors that.
position_layout() {
    local canvas_h="$1" layout="$2" device_h="$3" stack_h="$4"
    local edge_margin gap device_y text_y
    edge_margin=$(awk -v h="$canvas_h" -v f="$TEXT_EDGE_MARGIN_FRACTION" 'BEGIN { printf "%d", h * f }')
    gap=$(awk -v h="$canvas_h" -v f="$TEXT_DEVICE_GAP_FRACTION" 'BEGIN { printf "%d", h * f }')
    if [[ "$layout" == "A" ]]; then
        text_y="$edge_margin"
        device_y=$((text_y + stack_h + gap))
    else
        device_y="$edge_margin"
        text_y=$((device_y + device_h + gap))
    fi
    echo "$device_y $text_y"
}

compose_one() {
    local device="$1" scene="$2" appearance="$3" layout="$4" height_fraction="$5" out_name="$6"
    local device_slug frame_file cutout_x cutout_y cutout_w cutout_h
    local src canvas_w canvas_h headline descriptor
    local frame_native_w frame_native_h frame_h frame_w frame_x
    local work stack_h device_y text_y

    case "$device" in
        iphone)
            device_slug="$IPHONE_DEVICE_SLUG"
            frame_file="$IPHONE_FRAME"
            cutout_x=$IPHONE_CUTOUT_X
            cutout_y=$IPHONE_CUTOUT_Y
            cutout_w=$IPHONE_CUTOUT_W
            cutout_h=$IPHONE_CUTOUT_H
            ;;
        ipad)
            device_slug="$IPAD_DEVICE_SLUG"
            frame_file="$IPAD_FRAME"
            cutout_x=$IPAD_CUTOUT_X
            cutout_y=$IPAD_CUTOUT_Y
            cutout_w=$IPAD_CUTOUT_W
            cutout_h=$IPAD_CUTOUT_H
            ;;
        *)
            echo "error: unknown device '$device'" >&2
            exit 1
            ;;
    esac

    src="$RAW_DIR/$device_slug/$RAW_LOCALE/$appearance/$scene.png"
    if [[ ! -f "$src" ]]; then
        echo "error: missing raw capture $src" >&2
        exit 1
    fi

    headline="$(string_for "$TITLES" "$scene" 'headline')"
    descriptor="$(string_for "$SUBTITLES" "$scene" 'descriptor')"

    canvas_w="$(magick identify -format "%w" "$src")"
    canvas_h="$(magick identify -format "%h" "$src")"
    if ((canvas_w >= canvas_h)); then
        echo "error: raw capture $src is ${canvas_w}x${canvas_h}; only portrait captures are supported" >&2
        exit 1
    fi

    frame_native_w="$(magick identify -format "%w" "$frame_file")"
    frame_native_h="$(magick identify -format "%h" "$frame_file")"
    work="$(mktemp -d "$WORK_ROOT/compose-XXXXXX")"

    magick -size "${canvas_w}x${canvas_h}" "gradient:${BACKGROUND_TOP_HEX}-${BACKGROUND_BOTTOM_HEX}" \
        -define png:color-type=2 -depth 8 "$work/bg.png"

    frame_capture "$src" "$frame_file" "$cutout_x" "$cutout_y" "$cutout_w" "$cutout_h" "$work/framed-device.png"

    frame_h=$(awk -v h="$canvas_h" -v f="$height_fraction" 'BEGIN { printf "%d", h * f }')
    frame_w=$(awk -v fh="$frame_h" -v nw="$frame_native_w" -v nh="$frame_native_h" 'BEGIN { printf "%d", (fh * nw) / nh }')
    frame_x=$(((canvas_w - frame_w) / 2))

    magick "$work/framed-device.png" -resize "${frame_w}x${frame_h}!" \
        -define png:color-type=6 -depth 8 "$work/framed-device-scaled.png"

    build_text_stack "$canvas_w" "$canvas_h" "$headline" "$descriptor" "$work/text-stack.png"
    stack_h="$(magick identify -format "%h" "$work/text-stack.png")"

    read -r device_y text_y <<< "$(position_layout "$canvas_h" "$layout" "$frame_h" "$stack_h")"

    magick -size "${canvas_w}x${canvas_h}" xc:none "$work/framed-device-scaled.png" \
        -geometry "+${frame_x}+${device_y}" -compose Over -composite \
        -define png:color-type=6 -depth 8 "$work/device-on-canvas.png"

    build_shadow "$work/device-on-canvas.png" "$canvas_w" "$canvas_h" "$work/shadow.png"

    magick "$work/bg.png" "$work/shadow.png" -compose Over -composite \
        "$work/device-on-canvas.png" -compose Over -composite \
        "$work/text-stack.png" -gravity North -geometry "+0+${text_y}" -compose Over -composite \
        -alpha off -define png:color-type=2 -depth 8 "$work/final.png"

    mkdir -p "$OUT_DIR"
    cp "$work/final.png" "$OUT_DIR/$out_name"
    rm -rf "$work"

    echo "wrote $OUT_DIR/$out_name (${canvas_w}x${canvas_h}), layout $layout, headline: \"$headline\""
}

# device | scene | layout | device height fraction | output filename
#
# This list is the only scene enumeration: raw captures are read by name from it,
# never discovered from the raw directory, so a raw PNG with no entry here - such
# as the capture matrix's 00-prime deep-link trust scene - is never composed and
# can never reach variants/, the PR gallery, or deliver. A scene added here
# without matching design/<locale>/title.strings and subtitle.strings entries
# fails closed in string_for().
#
# Curated store order, mirroring the app's own navigation: the balance overview
# first, then the record it builds from, then what the app makes of that record,
# then the acts of budgeting and capturing, and finally the account and privacy
# story. Layout alternates A (text top / device bottom) and B (device top / text
# bottom) by position for scroll rhythm; the first and last shot of each device's
# run use the taller end of the device height range. The appearance is not part
# of the manifest - each variant composes the whole run from its own appearance's
# raw captures, so a light set and a dark set are the same story twice.
SCENES=(
    "iphone|01-home|A|$DEVICE_HEIGHT_FRACTION_ENDPOINT|01_iphone_home.png"
    "iphone|02-transactions|B|$DEVICE_HEIGHT_FRACTION_DEFAULT|02_iphone_transactions.png"
    "iphone|03-analytics|A|$DEVICE_HEIGHT_FRACTION_DEFAULT|03_iphone_analytics.png"
    "iphone|04-budget|B|$DEVICE_HEIGHT_FRACTION_DEFAULT|04_iphone_budget.png"
    "iphone|05-add-expense|A|$DEVICE_HEIGHT_FRACTION_DEFAULT|05_iphone_add-expense.png"
    "iphone|06-account|B|$DEVICE_HEIGHT_FRACTION_DEFAULT|06_iphone_account.png"
    "iphone|07-settings|A|$DEVICE_HEIGHT_FRACTION_ENDPOINT|07_iphone_settings.png"
    "ipad|01-home|A|$DEVICE_HEIGHT_FRACTION_ENDPOINT|21_ipad_home.png"
    "ipad|02-transactions|B|$DEVICE_HEIGHT_FRACTION_DEFAULT|22_ipad_transactions.png"
    "ipad|03-analytics|A|$DEVICE_HEIGHT_FRACTION_DEFAULT|23_ipad_analytics.png"
    "ipad|04-budget|B|$DEVICE_HEIGHT_FRACTION_DEFAULT|24_ipad_budget.png"
    "ipad|05-add-expense|A|$DEVICE_HEIGHT_FRACTION_DEFAULT|25_ipad_add-expense.png"
    "ipad|06-account|B|$DEVICE_HEIGHT_FRACTION_DEFAULT|26_ipad_account.png"
    "ipad|07-settings|A|$DEVICE_HEIGHT_FRACTION_ENDPOINT|27_ipad_settings.png"
)

run_variant() {
    local variant="$1" entry device scene layout height_fraction out_name
    set_variant_palette "$variant"

    OUT_DIR="$STAGE_ROOT/$variant-ios-$ASC_LOCALE"
    mkdir -p "$OUT_DIR"

    for entry in "${SCENES[@]}"; do
        IFS='|' read -r device scene layout height_fraction out_name <<< "$entry"
        if [[ "$DEVICE_ARGUMENT" != "all" && "$DEVICE_ARGUMENT" != "$device" ]]; then
            continue
        fi
        compose_one "$device" "$scene" "$variant" "$layout" "$height_fraction" "$out_name"
    done

    publish_stage "$SCREENSHOTS_DIR/variants/${PUBLISH_VARIANT_NAME:-$variant}/ios/$ASC_LOCALE"
}

for ASC_LOCALE in "${SELECTED_LOCALES[@]}"; do
    RAW_LOCALE="$(raw_locale_for "$ASC_LOCALE")"
    TITLES="$DESIGN_DIR/$ASC_LOCALE/title.strings"
    SUBTITLES="$DESIGN_DIR/$ASC_LOCALE/subtitle.strings"

    if [[ ! -f "$TITLES" ]]; then
        echo "error: no title.strings for locale '$ASC_LOCALE' at $TITLES" >&2
        exit 1
    fi
    if [[ ! -f "$SUBTITLES" ]]; then
        echo "error: no subtitle.strings for locale '$ASC_LOCALE' at $SUBTITLES" >&2
        exit 1
    fi

    if [[ "$VARIANT_ARGUMENT" == "all" ]]; then
        run_variant light
        run_variant dark
    else
        run_variant "$VARIANT_ARGUMENT"
    fi
done

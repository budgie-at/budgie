#!/usr/bin/env bash
# Composes the captioned, framed App Store story on the brand canvas; the layout and every constant are documented in design/README.md.
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCREENSHOTS_DIR="$(cd "$DESIGN_DIR/.." && pwd)"
APP_DIR="$(cd "$SCREENSHOTS_DIR/../.." && pwd)"
RAW_DIR="${SCREENSHOTS_RAW_DIR:-$SCREENSHOTS_DIR/raw}/ios"
FONT="${CAPTION_FONT:-$APP_DIR/assets/fonts/FixelDisplay-Bold.ttf}"
SUBLINE_FONT="${SUBLINE_FONT:-$APP_DIR/assets/fonts/FixelDisplay-SemiBold.ttf}"

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

if [[ -n "${PUBLISH_VARIANT_NAME:-}" && "$VARIANT_ARGUMENT" == "all" ]]; then
    echo "error: PUBLISH_VARIANT_NAME ('$PUBLISH_VARIANT_NAME') publishes every appearance into variants/$PUBLISH_VARIANT_NAME, so it cannot be combined with the 'all' appearance argument - light and dark would overwrite each other. Pass light or dark." >&2
    exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
    echo "error: ImageMagick 7 ('magick') is required on PATH" >&2
    exit 1
fi
for font_file in "$FONT" "$SUBLINE_FONT"; do
    if [[ ! -f "$font_file" ]]; then
        echo "error: caption font not found at $font_file (override with CAPTION_FONT / SUBLINE_FONT)" >&2
        exit 1
    fi
done

source "$DESIGN_DIR/frame-device.sh"

ALL_LOCALES=(en-US fr-FR uk de-DE es-ES)
SELECTED_LOCALES=()
if [[ "$LOCALE_ARGUMENT" == "all" ]]; then
    SELECTED_LOCALES=("${ALL_LOCALES[@]}")
else
    SELECTED_LOCALES=("$LOCALE_ARGUMENT")
fi

resolve_frameit_frames_dir
resolve_device_frames

CANVAS_PALETTES=(
    '#003B25|#00140C|0,119,80'
    '#013B22|#00140A|7,118,73'
    '#003B29|#00150D|0,119,86'
    '#003B23|#00140B|0,119,76'
    '#043B20|#001409|18,118,70'
    '#003B28|#00140D|0,119,84'
    '#003C2C|#00150F|0,119,92'
)
TEXT_HEX='#FFFFFF'
HIGHLIGHT_HEX='#54EAA6'
SUBLINE_FILL='rgba(255,255,255,0.92)'
CHIP_FILL='rgba(84,234,166,0.10)'
CHIP_STROKE='rgba(84,234,166,0.60)'
CHIP_TEXT_HEX='#DFFBEE'

REFERENCE_ASPECT_W_OVER_H='0.46003051'
HEADLINE_FRACTION='0.115'
HEADLINE_MIN_RATIO='0.72'
HEADLINE_SHRINK_STEP=4
HEADLINE_LEADING='1.02'
HEADLINE_TRACKING_EM='-0.025'
TEXT_WIDTH_FRACTION='0.88'
SUBLINE_RATIO='0.70'
SUBLINE_LEADING_EM='-0.14'
CHIP_RATIO='0.33'

TOP_MARGIN_FRACTION='0.052'
HEADLINE_SUBLINE_GAP_FRACTION='0.019'
CHIP_GAP_FRACTION='0.026'
TEXT_DEVICE_GAP_FRACTION='0.030'

GLOW_SIZE_RATIO='1.25'
GLOW_OPACITY='0.55'
SHADOW_OPACITY='0.45'
SHADOW_BLUR_RATIO='0.016'
SHADOW_OFFSET_RATIO='0.012'

WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-compose-work.XXXXXX")"
STAGE_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-compose-stage.XXXXXX")"
trap 'rm -rf "$WORK_ROOT" "$STAGE_ROOT"' EXIT

OUT_DIR=''

optimize_png() {
    local png="$1"
    if command -v oxipng >/dev/null 2>&1; then
        oxipng -o 4 --strip safe -q "$png"
    else
        magick "$png" -strip -define png:compression-level=9 -define png:compression-filter=5 -define png:exclude-chunk=all "$png"
    fi
}

publish_stage() {
    local final_dir="$1" staged_count png
    staged_count="$(find "$OUT_DIR" -maxdepth 1 -name '*.png' | wc -l | tr -d ' ')"
    if [[ "$staged_count" == "0" ]]; then
        echo "error: nothing composed for $final_dir, keeping the published set" >&2
        exit 1
    fi

    for png in "$OUT_DIR"/*.png; do
        optimize_png "$png"
    done

    mkdir -p "$final_dir"
    rm -f "$final_dir"/*.png
    mv "$OUT_DIR"/*.png "$final_dir/"
    echo "published $staged_count screenshots to $final_dir"
}

string_for() {
    local file="$1" scene="$2" label="$3" line
    line="$(grep -F "\"$scene\" = " "$file" || true)"
    if [[ -z "$line" ]]; then
        if [[ "$label" == "chips" ]]; then
            return 0
        fi
        echo "error: no $label for scene '$scene' in $file" >&2
        exit 1
    fi
    echo "$line" | sed -E 's/^"[^"]+" = "(.*)";$/\1/'
}

calc() {
    awk "BEGIN { printf \"%d\", $1 }"
}

escape_magick_text() {
    local text="${1//\\/\\\\}"
    echo "${text//%/%%}"
}

render_headline_line() {
    local pointsize="$1" line="$2" out="$3"
    local kerning segment index=0 segment_files=() segments=() fill
    kerning=$(awk -v p="$pointsize" -v t="$HEADLINE_TRACKING_EM" 'BEGIN { printf "%.2f", p * t }')
    IFS='*' read -r -a segments <<< "$line"
    for segment in "${segments[@]}"; do
        if [[ -n "$segment" ]]; then
            fill="$TEXT_HEX"
            if ((index % 2 == 1)); then
                fill="$HIGHLIGHT_HEX"
            fi
            segment_files+=("$out.segment-$index.png")
            magick -background none -fill "$fill" -font "$FONT" -pointsize "$pointsize" -kerning "$kerning" \
                label:"$(escape_magick_text "$segment")" -define png:color-type=6 -depth 8 "$out.segment-$index.png"
        fi
        index=$((index + 1))
    done
    magick -background none "${segment_files[@]}" +append -define png:color-type=6 -depth 8 "$out"
    rm -f "${segment_files[@]}"
}

render_headline() {
    local pointsize="$1" text="$2" out="$3"
    local line index=0 line_index pitch line_h=0 block_w=0 block_h width layers=()
    pitch=$(calc "$pointsize * $HEADLINE_LEADING")
    while IFS= read -r line; do
        render_headline_line "$pointsize" "$line" "$out.line-$index.png"
        width="$(magick identify -format "%w" "$out.line-$index.png")"
        line_h="$(magick identify -format "%h" "$out.line-$index.png")"
        if ((width > block_w)); then
            block_w=$width
        fi
        index=$((index + 1))
    done < <(printf '%s\n' "${text//\\n/$'\n'}")
    block_h=$((pitch * (index - 1) + line_h))
    for ((line_index = 0; line_index < index; line_index++)); do
        layers+=("$out.line-$line_index.png" -gravity North -geometry "+0+$((line_index * pitch))" -compose Over -composite)
    done
    magick -size "${block_w}x${block_h}" xc:none "${layers[@]}" -trim +repage -define png:color-type=6 -depth 8 "$out"
    for ((line_index = 0; line_index < index; line_index++)); do
        rm -f "$out.line-$line_index.png"
    done
}

fit_headline() {
    local effective_w="$1" cap_w="$2" text="$3" out="$4"
    local max_pt min_pt pt width
    max_pt=$(calc "$effective_w * $HEADLINE_FRACTION")
    min_pt=$(calc "$max_pt * $HEADLINE_MIN_RATIO")
    pt="$max_pt"
    render_headline "$pt" "$text" "$out"
    width="$(magick identify -format "%w" "$out")"
    while ((width > cap_w && pt > min_pt)); do
        pt=$((pt - HEADLINE_SHRINK_STEP))
        if ((pt < min_pt)); then
            pt=$min_pt
        fi
        render_headline "$pt" "$text" "$out"
        width="$(magick identify -format "%w" "$out")"
    done
    if ((width > cap_w)); then
        echo "note: headline \"$text\" is ${width}px at its minimum point size, wider than the ${cap_w}px caption width; scaling it down - shorten the copy" >&2
        magick "$out" -resize "${cap_w}x" -define png:color-type=6 -depth 8 "$out"
    fi
    echo "$pt"
}

subline_height() {
    magick -background none -font "$SUBLINE_FONT" -pointsize "$1" -kerning "$2" -interline-spacing "$3" \
        -size "${4}x" caption:"$(escape_magick_text "$5")" -format "%h" info:
}

render_subline() {
    local pointsize="$1" cap_w="$2" text="$3" out="$4"
    local kerning leading full_h low high middle
    kerning=$(awk -v p="$pointsize" 'BEGIN { printf "%.2f", p * -0.01 }')
    leading=$(calc "$pointsize * $SUBLINE_LEADING_EM")
    full_h="$(subline_height "$pointsize" "$kerning" "$leading" "$cap_w" "$text")"
    low=$((cap_w / 3))
    high=$cap_w
    while ((high - low > 8)); do
        middle=$(((low + high) / 2))
        if (($(subline_height "$pointsize" "$kerning" "$leading" "$middle" "$text") == full_h)); then
            high=$middle
        else
            low=$middle
        fi
    done
    magick -background none -fill "$SUBLINE_FILL" -font "$SUBLINE_FONT" -pointsize "$pointsize" -kerning "$kerning" \
        -interline-spacing "$leading" -gravity center -size "${high}x" caption:"$(escape_magick_text "$text")" \
        -trim +repage -define png:color-type=6 -depth 8 "$out"
}

render_chips() {
    local pointsize="$1" cap_w="$2" text="$3" out="$4"
    local chip index=0 chip_files=() pad_x pad_y radius stroke text_w text_h chip_w chip_h gap
    pad_x=$(calc "$pointsize * 0.85")
    pad_y=$(calc "$pointsize * 0.42")
    stroke=$(calc "$pointsize * 0.06 + 1")
    gap=$(calc "$pointsize * 0.45")
    while IFS= read -r chip; do
        magick -background none -fill "$CHIP_TEXT_HEX" -font "$SUBLINE_FONT" -pointsize "$pointsize" \
            label:"$(escape_magick_text "$chip")" -trim +repage -define png:color-type=6 -depth 8 "$out.text-$index.png"
        text_w="$(magick identify -format "%w" "$out.text-$index.png")"
        text_h=$(calc "$pointsize * 0.74")
        chip_w=$((text_w + 2 * pad_x))
        chip_h=$((text_h + 2 * pad_y))
        radius=$((chip_h / 2))
        magick -size "${chip_w}x${chip_h}" xc:none -fill "$CHIP_FILL" -stroke "$CHIP_STROKE" -strokewidth "$stroke" \
            -draw "roundrectangle $stroke,$stroke $((chip_w - stroke - 1)),$((chip_h - stroke - 1)) $radius,$radius" \
            "$out.text-$index.png" -gravity center -compose Over -composite -define png:color-type=6 -depth 8 "$out.chip-$index.png"
        if ((index > 0)); then
            chip_files+=("-size" "${gap}x${chip_h}" "xc:none")
        fi
        chip_files+=("$out.chip-$index.png")
        rm -f "$out.text-$index.png"
        index=$((index + 1))
    done < <(printf '%s\n' "${text// • /$'\n'}")
    magick -background none "${chip_files[@]}" -gravity center +append -define png:color-type=6 -depth 8 "$out"
    rm -f "$out".chip-*.png
    if (($(magick identify -format "%w" "$out") > cap_w)); then
        magick "$out" -resize "${cap_w}x" -define png:color-type=6 -depth 8 "$out"
    fi
}

build_text_stack() {
    local canvas_w="$1" canvas_h="$2" headline="$3" subline="$4" chips="$5" out="$6"
    local effective_w cap_w headline_pt layers=() stack_h=0 block_h gap
    effective_w=$(awk -v w="$canvas_w" -v h="$canvas_h" -v a="$REFERENCE_ASPECT_W_OVER_H" \
        'BEGIN { aspect_w = h * a; printf "%d", (aspect_w < w ? aspect_w : w) }')
    cap_w=$(calc "$canvas_w * $TEXT_WIDTH_FRACTION")

    headline_pt="$(fit_headline "$effective_w" "$cap_w" "$headline" "$out.headline.png")"
    layers+=("$out.headline.png" -gravity North -geometry "+0+0" -compose Over -composite)
    stack_h="$(magick identify -format "%h" "$out.headline.png")"

    if [[ -n "$subline" ]]; then
        render_subline "$(calc "$headline_pt * $SUBLINE_RATIO")" "$cap_w" "$subline" "$out.subline.png"
        gap=$(calc "$canvas_h * $HEADLINE_SUBLINE_GAP_FRACTION")
        layers+=("$out.subline.png" -gravity North -geometry "+0+$((stack_h + gap))" -compose Over -composite)
        block_h="$(magick identify -format "%h" "$out.subline.png")"
        stack_h=$((stack_h + gap + block_h))
    fi

    if [[ -n "$chips" ]]; then
        render_chips "$(calc "$headline_pt * $CHIP_RATIO")" "$cap_w" "$chips" "$out.chips.png"
        gap=$(calc "$canvas_h * $CHIP_GAP_FRACTION")
        layers+=("$out.chips.png" -gravity North -geometry "+0+$((stack_h + gap))" -compose Over -composite)
        block_h="$(magick identify -format "%h" "$out.chips.png")"
        stack_h=$((stack_h + gap + block_h))
    fi

    magick -size "${cap_w}x${stack_h}" xc:none "${layers[@]}" -define png:color-type=6 -depth 8 "$out"
    rm -f "$out.headline.png" "$out.subline.png" "$out.chips.png"
}

build_shadow() {
    local device_on_canvas="$1" canvas_w="$2" canvas_h="$3" out="$4"
    local blur offset
    blur=$(calc "$canvas_h * $SHADOW_BLUR_RATIO")
    offset=$(calc "$canvas_h * $SHADOW_OFFSET_RATIO")
    magick "$device_on_canvas" -fill black -colorize 100% \
        -channel A -evaluate multiply "$SHADOW_OPACITY" -blur "0x${blur}" +channel \
        -define png:color-type=6 -depth 8 "$out.silhouette.png"
    magick -size "${canvas_w}x${canvas_h}" xc:none "$out.silhouette.png" \
        -gravity NorthWest -geometry "+0+${offset}" -compose Over -composite \
        -define png:color-type=6 -depth 8 "$out"
    rm -f "$out.silhouette.png"
}

compose_one() {
    local device="$1" scene="$2" appearance="$3" palette_index="$4" width_fraction="$5" out_name="$6"
    local device_slug frame_file cutout_x cutout_y cutout_w cutout_h
    local src canvas_w canvas_h headline subline chips work
    local top_hex bottom_hex glow_rgb frame_w frame_h device_w device_h device_x device_y
    local stack_h text_y glow_size glow_x glow_y

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
    subline="$(string_for "$SUBTITLES" "$scene" 'subline')"
    chips="$(string_for "$CHIPS" "$scene" 'chips')"

    canvas_w="$(magick identify -format "%w" "$src")"
    canvas_h="$(magick identify -format "%h" "$src")"
    if ((canvas_w >= canvas_h)); then
        echo "error: raw capture $src is ${canvas_w}x${canvas_h}; only portrait captures are supported" >&2
        exit 1
    fi

    IFS='|' read -r top_hex bottom_hex glow_rgb <<< "${CANVAS_PALETTES[$palette_index]}"
    work="$(mktemp -d "$WORK_ROOT/compose-XXXXXX")"

    build_text_stack "$canvas_w" "$canvas_h" "$headline" "$subline" "$chips" "$work/text-stack.png"
    stack_h="$(magick identify -format "%h" "$work/text-stack.png")"
    text_y=$(calc "$canvas_h * $TOP_MARGIN_FRACTION")

    frame_capture "$src" "$frame_file" "$cutout_x" "$cutout_y" "$cutout_w" "$cutout_h" "$work/framed-device.png"
    frame_w="$(magick identify -format "%w" "$frame_file")"
    frame_h="$(magick identify -format "%h" "$frame_file")"
    device_w=$(calc "$canvas_w * $width_fraction")
    device_h=$(calc "$device_w * $frame_h / $frame_w")
    magick "$work/framed-device.png" -resize "${device_w}x${device_h}!" \
        -define png:color-type=6 -depth 8 "$work/framed-device-scaled.png"
    device_x=$(((canvas_w - device_w) / 2))
    device_y=$((text_y + stack_h + $(calc "$canvas_h * $TEXT_DEVICE_GAP_FRACTION")))

    glow_size=$(calc "$canvas_w * $GLOW_SIZE_RATIO")
    glow_x=$(((canvas_w - glow_size) / 2))
    glow_y=$((device_y - glow_size / 3))
    magick -size "${canvas_w}x${canvas_h}" "gradient:${top_hex}-${bottom_hex}" \
        \( -size "${glow_size}x${glow_size}" "radial-gradient:rgba(${glow_rgb},${GLOW_OPACITY})-rgba(${glow_rgb},0)" \) \
        -geometry "+${glow_x}+${glow_y}" -compose Over -composite \
        -define png:color-type=2 -depth 8 "$work/bg.png"

    magick -size "${canvas_w}x${canvas_h}" xc:none "$work/framed-device-scaled.png" \
        -geometry "+${device_x}+${device_y}" -compose Over -composite \
        -define png:color-type=6 -depth 8 "$work/device-on-canvas.png"
    build_shadow "$work/device-on-canvas.png" "$canvas_w" "$canvas_h" "$work/shadow.png"

    magick "$work/bg.png" "$work/shadow.png" -compose Over -composite \
        "$work/device-on-canvas.png" -compose Over -composite \
        "$work/text-stack.png" -gravity North -geometry "+0+${text_y}" -compose Over -composite \
        -alpha off -define png:color-type=2 -depth 8 "$work/final.png"

    mkdir -p "$OUT_DIR"
    cp "$work/final.png" "$OUT_DIR/$out_name"
    rm -rf "$work"

    echo "wrote $OUT_DIR/$out_name (${canvas_w}x${canvas_h}), headline: \"$headline\""
}

SCENES=(
    "iphone|01-home|0|0.92|01_iphone_home.png"
    "iphone|05-add-expense|1|0.80|02_iphone_add-expense.png"
    "iphone|03-analytics|2|0.80|03_iphone_analytics.png"
    "iphone|04-budget|3|0.80|04_iphone_budget.png"
    "iphone|09-inbox|4|0.80|05_iphone_inbox.png"
    "iphone|06-account|5|0.80|06_iphone_account.png"
    "iphone|07-settings|6|0.80|07_iphone_settings.png"
    "ipad|01-home|0|0.88|21_ipad_home.png"
    "ipad|05-add-expense|1|0.80|22_ipad_add-expense.png"
    "ipad|03-analytics|2|0.80|23_ipad_analytics.png"
    "ipad|04-budget|3|0.80|24_ipad_budget.png"
    "ipad|09-inbox|4|0.80|25_ipad_inbox.png"
    "ipad|06-account|5|0.80|26_ipad_account.png"
    "ipad|07-settings|6|0.80|27_ipad_settings.png"
)

run_variant() {
    local variant="$1" entry device scene palette_index width_fraction out_name

    OUT_DIR="$STAGE_ROOT/$variant-ios-$ASC_LOCALE"
    mkdir -p "$OUT_DIR"

    for entry in "${SCENES[@]}"; do
        IFS='|' read -r device scene palette_index width_fraction out_name <<< "$entry"
        if [[ "$DEVICE_ARGUMENT" != "all" && "$DEVICE_ARGUMENT" != "$device" ]]; then
            continue
        fi
        compose_one "$device" "$scene" "$variant" "$palette_index" "$width_fraction" "$out_name"
    done

    publish_stage "$SCREENSHOTS_DIR/variants/${PUBLISH_VARIANT_NAME:-$variant}/ios/$ASC_LOCALE"
}

for ASC_LOCALE in "${SELECTED_LOCALES[@]}"; do
    RAW_LOCALE="$(raw_locale_for "$ASC_LOCALE")"
    TITLES="$DESIGN_DIR/$ASC_LOCALE/title.strings"
    SUBTITLES="$DESIGN_DIR/$ASC_LOCALE/subtitle.strings"
    CHIPS="$DESIGN_DIR/$ASC_LOCALE/chips.strings"

    for strings_file in "$TITLES" "$SUBTITLES" "$CHIPS"; do
        if [[ ! -f "$strings_file" ]]; then
            echo "error: missing $strings_file for locale '$ASC_LOCALE'" >&2
            exit 1
        fi
    done

    if [[ "$VARIANT_ARGUMENT" == "all" ]]; then
        run_variant light
        run_variant dark
    else
        run_variant "$VARIANT_ARGUMENT"
    fi
done

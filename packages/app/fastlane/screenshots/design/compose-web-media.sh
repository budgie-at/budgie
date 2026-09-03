#!/usr/bin/env bash
# Compose landing-site iPhone stills from the raw store captures into AVIF+WebP at packages/landing/public/media/<slug>/<locale>/<theme>/<scene>@2x.{avif,webp}.
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DESIGN_DIR/frame-device.sh"
SCREENSHOTS_DIR="$(cd "$DESIGN_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCREENSHOTS_DIR/../../../.." && pwd)"

RAW_ROOT="$SCREENSHOTS_DIR/landing-raw"
OUTPUT_ROOT="$REPO_ROOT/packages/landing/public/media"
SCENES_FILTER=''
DRY_RUN=0

OUTPUT_WIDTH=900
OUTPUT_HEIGHT=1955

# Measured on 3 real framed store screenshots downscaled to 900 wide (SSIM
# against the source PNG, ImageMagick 'compare -metric SSIM' distortion
# converted to similarity): avifenc -s 4 --min 0 --max 63 -a end-usage=q -a
# cq-level=30 -a tune=ssim averages 26,982 bytes at SSIM 0.998 (current
# --qcolor 80 --qalpha 80 averages 50,732 bytes at SSIM 0.999); cwebp/magick
# -quality 75 -define webp:method=6 averages 40,553 bytes at SSIM 0.996
# (current -quality 80 averages 46,961 bytes at SSIM 0.998). Both stay far
# above the 0.97 SSIM floor. Per-still averages, not a hard cap - scene
# content varies - test-compose-web-media.sh asserts a budget derived from
# these numbers on its own synthetic fixture.

fail() {
    echo "error: $*" >&2
    exit 1
}

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --raw-dir)
            RAW_ROOT="$2"
            shift 2
            ;;
        --output)
            OUTPUT_ROOT="$2"
            shift 2
            ;;
        --scenes)
            SCENES_FILTER="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        *)
            fail "unknown argument '$1'. Use --raw-dir, --output, --scenes or --dry-run."
            ;;
    esac
done

command -v magick >/dev/null 2>&1 || fail "ImageMagick 7 ('magick') is required on PATH"

resolve_frameit_frames_dir
resolve_device_frames

WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-web-media.XXXXXX")"
trap 'rm -rf "$WORK_ROOT"' EXIT

slug_for_scene() {
    echo "$1" | sed -E 's/-[0-9]+$//'
}

encode_still() {
    local src="$1" avif_out="$2" webp_out="$3"
    if command -v avifenc >/dev/null 2>&1; then
        avifenc -s 4 --min 0 --max 63 -a end-usage=q -a cq-level=30 -a tune=ssim "$src" "$avif_out" >/dev/null
    else
        magick "$src" -quality 60 "$avif_out"
    fi
    if command -v cwebp >/dev/null 2>&1; then
        cwebp -quiet -q 75 -m 6 "$src" -o "$webp_out"
    else
        magick "$src" -quality 75 -define webp:method=6 "$webp_out"
    fi
}

compose_capture() {
    local src="$1" avif_out="$2" webp_out="$3"
    local canvas_w canvas_h framed contained final
    canvas_w="$(magick identify -format "%w" "$src")"
    canvas_h="$(magick identify -format "%h" "$src")"

    framed="$WORK_ROOT/framed-$$-$RANDOM.png"
    frame_capture "$src" "$IPHONE_FRAME" "$IPHONE_CUTOUT_X" "$IPHONE_CUTOUT_Y" "$IPHONE_CUTOUT_W" "$IPHONE_CUTOUT_H" "$framed"

    contained="$WORK_ROOT/contained-$$-$RANDOM.png"
    magick -size "${canvas_w}x${canvas_h}" xc:none \
        \( "$framed" -resize "${canvas_w}x${canvas_h}" \) \
        -gravity center -compose Over -composite \
        -define png:color-type=6 -depth 8 "$contained"

    final="$WORK_ROOT/final-$$-$RANDOM.png"
    magick "$contained" -resize "${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}!" \
        -define png:color-type=6 -depth 8 "$final"

    encode_still "$final" "$avif_out" "$webp_out"
    rm -f "$framed" "$contained" "$final"
}

mapfile -t RAW_FILES < <(find "$RAW_ROOT/ios/$IPHONE_DEVICE_SLUG" -type f -name '*.png' 2>/dev/null | sort)

SCENES=()
if [[ -n "$SCENES_FILTER" ]]; then
    IFS=',' read -ra SCENES <<< "$SCENES_FILTER"
else
    for raw_file in "${RAW_FILES[@]}"; do
        SCENES+=("$(basename "$raw_file" .png)")
    done
    if ((${#SCENES[@]} > 0)); then
        mapfile -t SCENES < <(printf '%s\n' "${SCENES[@]}" | sort -u)
    fi
fi

COMPOSED_COUNT=0
for scene in "${SCENES[@]}"; do
    scene_matched=0
    for raw_file in "${RAW_FILES[@]}"; do
        [[ "$(basename "$raw_file" .png)" == "$scene" ]] || continue
        scene_matched=1
        appearance="$(basename "$(dirname "$raw_file")")"
        locale="$(basename "$(dirname "$(dirname "$raw_file")")")"
        slug="$(slug_for_scene "$scene")"
        destination="$OUTPUT_ROOT/$slug/$locale/$appearance"

        if ((DRY_RUN)); then
            echo "would write $destination/$scene@2x.avif $destination/$scene@2x.webp"
        else
            mkdir -p "$destination"
            compose_capture "$raw_file" "$destination/$scene@2x.avif" "$destination/$scene@2x.webp"
            echo "wrote $destination/$scene@2x.avif $destination/$scene@2x.webp"
        fi
        COMPOSED_COUNT=$((COMPOSED_COUNT + 1))
    done
    if ((scene_matched == 0)); then
        echo "note: no raw capture for scene '$scene' under $RAW_ROOT/ios/$IPHONE_DEVICE_SLUG"
    fi
done

if ((COMPOSED_COUNT == 0)); then
    fail "composed nothing: no raw capture matched under $RAW_ROOT/ios/$IPHONE_DEVICE_SLUG"
fi

echo "composed $COMPOSED_COUNT capture(s) into $OUTPUT_ROOT"

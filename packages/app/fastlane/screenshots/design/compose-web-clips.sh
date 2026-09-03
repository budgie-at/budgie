#!/usr/bin/env bash
# Compose landing-site clip media from raw Maestro recordings into webm+mp4+poster at packages/landing/public/media/<slug>/<locale>/<theme>/<scene>.{webm,mp4}+<scene>-poster.webp.
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCREENSHOTS_DIR="$(cd "$DESIGN_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCREENSHOTS_DIR/../../.." && pwd)"

RAW_ROOT="$SCREENSHOTS_DIR/landing-raw"
OUTPUT_ROOT="$REPO_ROOT/packages/landing/public/media"
SCENES_FILTER=''
DRY_RUN=0

MAX_CLIP_SECONDS=8
CLIP_WIDTH=900
POSTER_WIDTH=900
POSTER_HEIGHT=1955
IPHONE_DEVICE_SLUG='iphone-17-pro-max'

# VP9/H.264/poster settings below were measured on a synthetic 6.5s
# 1320x2868 slide-transition clip built from 3 real store screenshots
# (screen-recording proxy). At -crf 38 -b:v 0 -deadline good -cpu-used 2
# -row-mt 1, the 900-wide VP9 webm is ~244 KB (~225 KB projected for a 6s
# clip, under the ~250 KB/6s target) at SSIM 0.989 against the 900-wide
# source, versus the prior -crf 32 baseline's ~320 KB at SSIM 0.990 - an
# imperceptible quality difference for a ~24% size cut. H.264 at -crf 28
# -preset slow -tune animation is ~200 KB at SSIM 0.997 (prior -crf 26 was
# ~228 KB at SSIM 0.998). Poster webp -q 70 is ~43 KB (prior -q 80 ~50 KB).

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

command -v ffmpeg >/dev/null 2>&1 || fail "'ffmpeg' is required on PATH"
command -v magick >/dev/null 2>&1 || fail "ImageMagick 7 ('magick') is required on PATH"

WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-web-clips.XXXXXX")"
trap 'rm -rf "$WORK_ROOT"' EXIT

slug_for_scene() {
    echo "$1" | sed -E 's/-[0-9]+$//; s/-clip$//'
}

compose_clip() {
    local raw_mp4="$1" webm_out="$2" mp4_out="$3"
    local normalized
    normalized="$WORK_ROOT/normalized-$$-$RANDOM.mp4"
    ffmpeg -nostdin -y -hide_banner -loglevel error -t "$MAX_CLIP_SECONDS" -i "$raw_mp4" \
        -vf "scale=${CLIP_WIDTH}:-2:flags=lanczos,fps=24" -an \
        -c:v libx264 -crf 16 -preset veryfast -pix_fmt yuv420p "$normalized"
    ffmpeg -nostdin -y -hide_banner -loglevel error -i "$normalized" \
        -an -c:v libvpx-vp9 -crf 38 -b:v 0 -deadline good -cpu-used 2 -row-mt 1 -pix_fmt yuv420p "$webm_out"
    ffmpeg -nostdin -y -hide_banner -loglevel error -i "$normalized" \
        -an -c:v libx264 -profile:v high -crf 28 -preset slow -tune animation -pix_fmt yuv420p -movflags +faststart "$mp4_out"
    rm -f "$normalized"
}

encode_poster() {
    local src="$1" out="$2" resized
    resized="$WORK_ROOT/poster-$$-$RANDOM.png"
    magick "$src" -resize "${POSTER_WIDTH}x${POSTER_HEIGHT}!" "$resized"
    if command -v cwebp >/dev/null 2>&1; then
        cwebp -quiet -q 70 "$resized" -o "$out"
    else
        magick "$resized" -quality 70 "$out"
    fi
    rm -f "$resized"
}

mapfile -t RAW_FILES < <(find "$RAW_ROOT/ios/$IPHONE_DEVICE_SLUG" -type f -name '*.mp4' 2>/dev/null | sort)

SCENES=()
if [[ -n "$SCENES_FILTER" ]]; then
    IFS=',' read -ra SCENES <<< "$SCENES_FILTER"
else
    for raw_file in "${RAW_FILES[@]}"; do
        SCENES+=("$(basename "$raw_file" .mp4)")
    done
    if ((${#SCENES[@]} > 0)); then
        mapfile -t SCENES < <(printf '%s\n' "${SCENES[@]}" | sort -u)
    fi
fi

COMPOSED_COUNT=0
for scene in "${SCENES[@]}"; do
    scene_matched=0
    for raw_file in "${RAW_FILES[@]}"; do
        [[ "$(basename "$raw_file" .mp4)" == "$scene" ]] || continue
        scene_matched=1
        appearance="$(basename "$(dirname "$raw_file")")"
        locale="$(basename "$(dirname "$(dirname "$raw_file")")")"
        poster_src="$(dirname "$raw_file")/$scene.png"
        if [[ ! -f "$poster_src" ]]; then
            fail "missing poster capture $poster_src for clip '$scene'"
        fi
        slug="$(slug_for_scene "$scene")"
        destination="$OUTPUT_ROOT/$slug/$locale/$appearance"

        if ((DRY_RUN)); then
            echo "would write $destination/$scene.webm $destination/$scene.mp4 $destination/$scene-poster.webp"
        else
            mkdir -p "$destination"
            compose_clip "$raw_file" "$destination/$scene.webm" "$destination/$scene.mp4"
            encode_poster "$poster_src" "$destination/$scene-poster.webp"
            echo "wrote $destination/$scene.webm $destination/$scene.mp4 $destination/$scene-poster.webp"
        fi
        COMPOSED_COUNT=$((COMPOSED_COUNT + 1))
    done
    if ((scene_matched == 0)); then
        echo "note: no raw clip for scene '$scene' under $RAW_ROOT/ios/$IPHONE_DEVICE_SLUG"
    fi
done

if ((COMPOSED_COUNT == 0)); then
    fail "composed nothing: no raw clip matched under $RAW_ROOT/ios/$IPHONE_DEVICE_SLUG"
fi

echo "composed $COMPOSED_COUNT clip(s) into $OUTPUT_ROOT"

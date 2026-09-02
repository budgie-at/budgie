#!/bin/bash
# Landing-media clip encoder. Turns the raw Maestro recordings produced by
# record-media-clips.sh into the web delivery set the landing <AppClip> contract
# expects: WebM (AV1, VP9 on request), MP4 (H.264, faststart) and a WebP poster.
#
# Every per-clip decision - owning route slug, trim window, poster timestamp,
# animated-WebP eligibility - is read from the committed clip map, so the encode
# never carries its own copy of the storyboard.
#
# Pipeline per cell (clip x locale x appearance):
#   trim to the storyboard duration -> optional lanczos downscale -> optional
#   seamless-loop crossfade of the tail into the head -> WebM + MP4 + WebP poster
#   -> byte budgets enforced
#
# GIF is never produced: 5-10x the bytes of the same VP9 clip, a 256-colour palette
# that bands Budgie's gradients, and unpausable under prefers-reduced-motion.
#
# Input layout (gitignored, written by record-media-clips.sh):
#   <input>/<clip>/<locale>/<appearance>/raw.mp4
# Output layout (the landing asset contract):
#   <output>/<route-slug>/<locale>/<theme>/<clip>.{webm,mp4,webp}
#
# Usage:
#   bash tests/app-tests/scripts/encode-media-clips.sh [options]
#
#   --input <dir>           raw clip root (default packages/landing/public/media-src/clips)
#   --output <dir>          delivery root (default packages/landing/public/media)
#   --map <path>            clip map (default tests/app-tests/flows/media/clip-routes.json)
#   --clips <a,b>           encode only these clips
#   --locales <a,b>         encode only these locales
#   --appearances <a,b>     encode only these appearances
#   --width <px>            downscale width (default from the map's encode.width)
#   --no-scale              keep the capture resolution
#   --vp9                   encode the WebM with VP9 instead of AV1
#   --loop-crossfade <ms>   tail-into-head crossfade length, 0 disables (default from the map)
#   --allow-oversize        report budget overruns as warnings instead of failing
#   --dry-run               print the resolved encode plan and exit
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

CLIP_MAP="$REPO_ROOT/tests/app-tests/flows/media/clip-routes.json"
INPUT_ROOT=''
OUTPUT_ROOT=''
CLIPS_OVERRIDE=''
LOCALES_FILTER=''
APPEARANCES_FILTER=''
WIDTH_OVERRIDE=''
LOOP_CROSSFADE_OVERRIDE=''
NO_SCALE='false'
USE_VP9='false'
ALLOW_OVERSIZE='false'
DRY_RUN='false'

fail() {
    echo "error: $*" >&2
    exit 1
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --input) INPUT_ROOT="${2:-}"; shift 2 ;;
        --output) OUTPUT_ROOT="${2:-}"; shift 2 ;;
        --map) CLIP_MAP="${2:-}"; shift 2 ;;
        --clips) CLIPS_OVERRIDE="${2:-}"; shift 2 ;;
        --locales) LOCALES_FILTER="${2:-}"; shift 2 ;;
        --appearances) APPEARANCES_FILTER="${2:-}"; shift 2 ;;
        --width) WIDTH_OVERRIDE="${2:-}"; shift 2 ;;
        --loop-crossfade) LOOP_CROSSFADE_OVERRIDE="${2:-}"; shift 2 ;;
        --no-scale) NO_SCALE='true'; shift ;;
        --vp9) USE_VP9='true'; shift ;;
        --allow-oversize) ALLOW_OVERSIZE='true'; shift ;;
        --dry-run) DRY_RUN='true'; shift ;;
        -h | --help) sed -n '2,37p' "$0"; exit 0 ;;
        *) fail "unknown argument '$1'" ;;
    esac
done

command -v jq >/dev/null 2>&1 || fail "'jq' is required to read $CLIP_MAP"
[ -f "$CLIP_MAP" ] || fail "no clip map at $CLIP_MAP"
jq -e . "$CLIP_MAP" >/dev/null 2>&1 || fail "$CLIP_MAP is not valid JSON"

map_value() {
    jq -r "$1" "$CLIP_MAP"
}

if [ -z "$INPUT_ROOT" ]; then
    INPUT_ROOT="$REPO_ROOT/$(map_value '.input.root')"
fi
if [ -z "$OUTPUT_ROOT" ]; then
    OUTPUT_ROOT="$REPO_ROOT/$(map_value '.output.root')"
fi

WIDTH="${WIDTH_OVERRIDE:-$(map_value '.encode.width // 900')}"
case "$WIDTH" in
    '' | *[!0-9]*) fail "--width must be a positive integer, got '$WIDTH'" ;;
esac

LOOP_CROSSFADE_MS="${LOOP_CROSSFADE_OVERRIDE:-$(map_value '.encode.loopCrossfadeMs // 150')}"
case "$LOOP_CROSSFADE_MS" in
    '' | *[!0-9]*) fail "--loop-crossfade must be a non-negative integer number of milliseconds, got '$LOOP_CROSSFADE_MS'" ;;
esac

AV1_CRF=$(map_value '.encode.av1Crf // 34')
VP9_CRF=$(map_value '.encode.vp9Crf // 34')
H264_CRF=$(map_value '.encode.h264Crf // 26')
POSTER_QUALITY=$(map_value '.encode.posterQuality // 82')
ANIMATED_WEBP_QUALITY=$(map_value '.encode.animatedWebpQuality // 70')
WEBM_BUDGET=$(map_value '.budgets.webmBytes // 1258291')
MP4_BUDGET=$(map_value '.budgets.mp4Bytes // 1887436')
POSTER_BUDGET=$(map_value '.budgets.posterBytes // 61440')

split_list() {
    printf '%s' "$1" | tr ',\n\t' '   ' | tr -s ' ' | sed -E 's/^ +//; s/ +$//'
}

# An empty filter list means "everything", which is how --locales / --appearances
# default to the whole matrix without a second code path.
list_contains() {
    [ -n "$1" ] || return 0

    printf '%s\n' "$(split_list "$1")" | tr ' ' '\n' | grep -qFx "$2"
}

clip_field() {
    jq -r --arg clip "$1" --arg field "$2" '.clips[$clip][$field] // empty' "$CLIP_MAP"
}

ALL_CLIPS=$(map_value '.clips | keys[]' | tr '\n' ' ')
CLIPS=$(split_list "${CLIPS_OVERRIDE:-$ALL_CLIPS}")
for clip in $CLIPS; do
    [ -n "$(clip_field "$clip" 'route')" ] || fail "clip '$clip' is not in $CLIP_MAP"
done

# WebM codec resolution. AV1 is the default; --vp9 forces the fallback build, and a
# ffmpeg without libsvtav1 falls back on its own rather than failing the run.
resolve_webm_codec() {
    if [ "$USE_VP9" = 'true' ]; then
        echo 'vp9'

        return 0
    fi
    if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q 'libsvtav1'; then
        echo 'av1'

        return 0
    fi

    echo "warning: this ffmpeg has no libsvtav1; encoding the WebM with VP9 instead" >&2
    echo 'vp9'
}

# Builds the filter graph. Trimming is done by -ss/-t on the input, so this is the
# scale plus the optional seamless loop: the last N ms are crossfaded over the first
# N ms and concatenated onto the body, which makes the last frame equal the first.
build_filter_complex() {
    local duration="$1" crossfade_seconds="$2" scale_filter="$3" body_end

    if [ "$crossfade_seconds" = '0' ]; then
        printf '[0:v]%ssetsar=1[out]' "$scale_filter"

        return 0
    fi

    body_end=$(awk -v duration="$duration" -v crossfade="$crossfade_seconds" 'BEGIN { printf "%.3f", duration - crossfade }')
    printf '[0:v]%ssetsar=1,split=3[body_src][tail_src][head_src];' "$scale_filter"
    printf '[body_src]trim=start=0:end=%s,setpts=PTS-STARTPTS[body];' "$body_end"
    printf '[tail_src]trim=start=%s,setpts=PTS-STARTPTS[tail];' "$body_end"
    printf '[head_src]trim=start=0:end=%s,setpts=PTS-STARTPTS[head];' "$crossfade_seconds"
    printf '[tail][head]xfade=transition=fade:duration=%s:offset=0[seam];' "$crossfade_seconds"
    printf '[body][seam]concat=n=2:v=1[out]'
}

assert_budget() {
    local path="$1" budget="$2" label="$3" size

    size=$(wc -c < "$path" | tr -d ' ')
    if [ "$size" -le "$budget" ]; then
        echo "    $label: ${size}B (budget ${budget}B)"

        return 0
    fi
    if [ "$ALLOW_OVERSIZE" = 'true' ]; then
        echo "    $label: ${size}B exceeds the ${budget}B budget (--allow-oversize)" >&2

        return 0
    fi

    echo "    $label: ${size}B exceeds the ${budget}B budget" >&2

    return 1
}

encode_cell() {
    local clip="$1" locale="$2" appearance="$3" raw="$4"
    local route duration trim_start poster_seconds animated_webp crossfade_seconds
    local scale_filter filter_complex out_dir webm mp4 poster codec normalized

    route=$(clip_field "$clip" 'route')
    duration=$(clip_field "$clip" 'durationSeconds')
    trim_start=$(clip_field "$clip" 'trimStartSeconds')
    poster_seconds=$(clip_field "$clip" 'posterSeconds')
    animated_webp=$(clip_field "$clip" 'animatedWebp')
    [ -n "$trim_start" ] || trim_start='0'
    [ -n "$poster_seconds" ] || poster_seconds='0'

    crossfade_seconds='0'
    if [ "$LOOP_CROSSFADE_MS" -gt 0 ]; then
        crossfade_seconds=$(awk -v ms="$LOOP_CROSSFADE_MS" 'BEGIN { printf "%.3f", ms / 1000 }')
    fi

    scale_filter=''
    if [ "$NO_SCALE" = 'false' ]; then
        scale_filter="scale='min($WIDTH,iw)':-2:flags=lanczos,"
    fi
    filter_complex=$(build_filter_complex "$duration" "$crossfade_seconds" "$scale_filter")

    out_dir="$OUTPUT_ROOT/$route/$locale/$appearance"
    webm="$out_dir/$clip.webm"
    mp4="$out_dir/$clip.mp4"
    poster="$out_dir/$clip.webp"
    mkdir -p "$out_dir"

    codec=$(resolve_webm_codec)
    normalized="$WORK_DIR/$clip-$locale-$appearance.mp4"

    # One trim/scale/loop pass, reused by every delivery encode so the three outputs
    # are frame-identical and the poster is taken from what actually ships.
    ffmpeg -nostdin -y -hide_banner -loglevel error \
        -ss "$trim_start" -t "$duration" -i "$raw" \
        -filter_complex "$filter_complex" -map '[out]' -an \
        -c:v libx264 -crf 16 -preset veryfast -pix_fmt yuv420p "$normalized"

    if [ "$codec" = 'av1' ]; then
        ffmpeg -nostdin -y -hide_banner -loglevel error -i "$normalized" \
            -an -c:v libsvtav1 -crf "$AV1_CRF" -preset 6 -pix_fmt yuv420p "$webm"
    else
        ffmpeg -nostdin -y -hide_banner -loglevel error -i "$normalized" \
            -an -c:v libvpx-vp9 -crf "$VP9_CRF" -b:v 0 -row-mt 1 -pix_fmt yuv420p "$webm"
    fi

    ffmpeg -nostdin -y -hide_banner -loglevel error -i "$normalized" \
        -an -c:v libx264 -profile:v high -crf "$H264_CRF" -pix_fmt yuv420p -movflags +faststart "$mp4"

    ffmpeg -nostdin -y -hide_banner -loglevel error -ss "$poster_seconds" -i "$normalized" \
        -frames:v 1 -c:v libwebp -quality "$POSTER_QUALITY" "$poster"

    # Sub-2s clips ship an animated WebP too: at that length a <video> element costs
    # more than the frames it plays.
    if [ "$animated_webp" = 'true' ]; then
        ffmpeg -nostdin -y -hide_banner -loglevel error -i "$normalized" \
            -an -c:v libwebp -loop 0 -q:v "$ANIMATED_WEBP_QUALITY" "$out_dir/$clip.animated.webp"
    fi

    echo "  $route/$locale/$appearance/$clip ($codec webm)"
    assert_budget "$webm" "$WEBM_BUDGET" 'webm'
    assert_budget "$mp4" "$MP4_BUDGET" 'mp4'
    assert_budget "$poster" "$POSTER_BUDGET" 'poster'
}

if [ "$DRY_RUN" = 'true' ]; then
    echo 'encode plan'
    echo "  map: $CLIP_MAP"
    echo "  input: $INPUT_ROOT"
    echo "  output: $OUTPUT_ROOT"
    echo "  width: $([ "$NO_SCALE" = 'true' ] && echo 'source' || echo "$WIDTH")"
    echo "  webm codec: $([ "$USE_VP9" = 'true' ] && echo 'vp9' || echo 'av1')"
    echo "  loop crossfade: ${LOOP_CROSSFADE_MS}ms"
    echo "  budgets: webm ${WEBM_BUDGET}B mp4 ${MP4_BUDGET}B poster ${POSTER_BUDGET}B"
    echo '  gif: never'
    for clip in $CLIPS; do
        echo "  $clip -> $(clip_field "$clip" 'route') ($(clip_field "$clip" 'durationSeconds')s, poster $(clip_field "$clip" 'posterSeconds')s)"
    done

    exit 0
fi

command -v ffmpeg >/dev/null 2>&1 || fail "'ffmpeg' is required to encode the clips"
[ -d "$INPUT_ROOT" ] || fail "no raw clip directory at '$INPUT_ROOT'; record the clips first"

WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/budgie-media-encode.XXXXXX")
trap 'rm -rf "$WORK_DIR"' EXIT

ENCODED=0
FAILURES=0
for clip in $CLIPS; do
    [ -d "$INPUT_ROOT/$clip" ] || continue
    for locale_dir in "$INPUT_ROOT/$clip"/*; do
        [ -d "$locale_dir" ] || continue
        locale=$(basename "$locale_dir")
        list_contains "$LOCALES_FILTER" "$locale" || continue
        for appearance_dir in "$locale_dir"/*; do
            [ -d "$appearance_dir" ] || continue
            appearance=$(basename "$appearance_dir")
            list_contains "$APPEARANCES_FILTER" "$appearance" || continue
            [ -f "$appearance_dir/raw.mp4" ] || continue
            if encode_cell "$clip" "$locale" "$appearance" "$appearance_dir/raw.mp4"; then
                ENCODED=$((ENCODED + 1))
            else
                FAILURES=$((FAILURES + 1))
            fi
        done
    done
done

[ "$ENCODED" -gt 0 ] || fail "no raw clips matched under '$INPUT_ROOT'"
if [ "$FAILURES" -gt 0 ]; then
    fail "$FAILURES cell(s) failed the byte budgets"
fi
echo "encoded $ENCODED cell(s) into $OUTPUT_ROOT"

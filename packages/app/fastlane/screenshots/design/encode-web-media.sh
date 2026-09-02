#!/usr/bin/env bash
#
# Encode the staged landing PNGs compose-web-media.sh writes into the two
# formats the site ships: AVIF (primary) and WebP (universal fallback), both at
# @2x, both under a per-class byte ceiling.
#
# Only the encoded files are committed. The staged PNG is a build intermediate
# and is gitignored, so this step is the boundary between "regenerable capture
# output" and "binary the repo carries".
#
# Encoders: `avifenc` and `cwebp` when they are on PATH, ImageMagick 7's own AVIF
# and WebP delegates otherwise, so a machine with only ImageMagick still
# produces shippable output.
#
# Usage:
#   packages/app/fastlane/screenshots/design/encode-web-media.sh [options]
#
#   --media-dir <dir>     media root (default packages/landing/public/media)
#   --groups <path>       scene -> route slug map (default web-media-groups.json)
#   --scenes <a,b>        only these scenes
#   --width-iphone <px>   framed iPhone output width (default 900)
#   --width-ipad <px>     framed iPad output width (default 1024)
#   --avif-quality <n>    avifenc/magick quality, 0-100 (default 60)
#   --webp-quality <n>    cwebp/magick quality, 0-100 (default 82)
#   --force               re-encode even when the outputs are up to date
#   --dry-run             print the plan and the current sizes, encode nothing
#
# Byte budgets come from the epic: 180 KB for a hero still, 120 KB for a feature
# still, both measured on the AVIF. WebP is the fallback format and is
# consistently larger on flat UI gradients, so its ceiling is the AVIF ceiling
# scaled by WEBP_BUDGET_RATIO. Every over-budget file is reported and the run
# exits non-zero, so a bloated asset can never be committed silently.
# WEB_MEDIA_HERO_AVIF_KB, WEB_MEDIA_FEATURE_AVIF_KB and
# WEB_MEDIA_WEBP_BUDGET_RATIO override the ceilings for a one-off experiment.
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCREENSHOTS_DIR="$(cd "$DESIGN_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCREENSHOTS_DIR/../../.." && pwd)"

MEDIA_ROOT="${WEB_MEDIA_OUTPUT_DIR:-$REPO_ROOT/packages/landing/public/media}"
GROUPS_PATH="$DESIGN_DIR/web-media-groups.json"
SCENES_ARGUMENT=''
WIDTH_IPHONE=900
WIDTH_IPAD=1024
AVIF_QUALITY=60
WEBP_QUALITY=82
FORCE='false'
DRY_RUN='false'

HERO_AVIF_BUDGET_BYTES=$((${WEB_MEDIA_HERO_AVIF_KB:-180} * 1024))
FEATURE_AVIF_BUDGET_BYTES=$((${WEB_MEDIA_FEATURE_AVIF_KB:-120} * 1024))
WEBP_BUDGET_RATIO="${WEB_MEDIA_WEBP_BUDGET_RATIO:-1.6}"

fail() {
    echo "error: $*" >&2
    exit 1
}

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --media-dir)
            MEDIA_ROOT="${2:-}"
            shift 2
            ;;
        --groups)
            GROUPS_PATH="${2:-}"
            shift 2
            ;;
        --scenes)
            SCENES_ARGUMENT="${2:-}"
            shift 2
            ;;
        --width-iphone)
            WIDTH_IPHONE="${2:-}"
            shift 2
            ;;
        --width-ipad)
            WIDTH_IPAD="${2:-}"
            shift 2
            ;;
        --avif-quality)
            AVIF_QUALITY="${2:-}"
            shift 2
            ;;
        --webp-quality)
            WEBP_QUALITY="${2:-}"
            shift 2
            ;;
        --force)
            FORCE='true'
            shift
            ;;
        --dry-run)
            DRY_RUN='true'
            shift
            ;;
        -h | --help)
            sed -n '2,30p' "$0"
            exit 0
            ;;
        *)
            fail "unknown argument '$1'. See --help."
            ;;
    esac
done

for numeric in "$WIDTH_IPHONE" "$WIDTH_IPAD" "$AVIF_QUALITY" "$WEBP_QUALITY"; do
    case "$numeric" in
        '' | *[!0-9]*) fail "expected a non-negative integer, got '$numeric'" ;;
    esac
done

command -v magick >/dev/null 2>&1 || fail "ImageMagick 7 ('magick') is required on PATH"
command -v jq >/dev/null 2>&1 || fail "'jq' is required to read $GROUPS_PATH"
[[ -f "$GROUPS_PATH" ]] || fail "no scene group map at $GROUPS_PATH"
jq -e . "$GROUPS_PATH" >/dev/null 2>&1 || fail "$GROUPS_PATH is not valid JSON"
[[ -d "$MEDIA_ROOT" ]] || fail "no media directory at $MEDIA_ROOT - run compose-web-media.sh first"

HAS_AVIFENC='false'
HAS_CWEBP='false'
command -v avifenc >/dev/null 2>&1 && HAS_AVIFENC='true'
command -v cwebp >/dev/null 2>&1 && HAS_CWEBP='true'

WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-web-encode.XXXXXX")"
trap 'rm -rf "$WORK_ROOT"' EXIT

scene_budget_bytes() {
    local budget
    budget="$(jq -r --arg scene "$1" '.scenes[$scene].budget // "feature"' "$GROUPS_PATH")"
    if [[ "$budget" == "hero" ]]; then
        echo "$HERO_AVIF_BUDGET_BYTES"
    else
        echo "$FEATURE_AVIF_BUDGET_BYTES"
    fi
}

scene_is_selected() {
    [[ -n "$SCENES_ARGUMENT" ]] || return 0

    printf '%s' "$SCENES_ARGUMENT" | tr ',' '\n' | grep -qFx "$1"
}

file_bytes() {
    if [[ ! -f "$1" ]]; then
        echo 0

        return 0
    fi

    wc -c < "$1" | tr -d ' '
}

kilobytes() {
    awk -v b="$1" 'BEGIN { printf "%.1f", b / 1024 }'
}

encode_avif() {
    local src="$1" out="$2"
    if [[ "$HAS_AVIFENC" == "true" ]]; then
        avifenc --speed 4 --qcolor "$AVIF_QUALITY" --qalpha "$AVIF_QUALITY" "$src" "$out" >/dev/null

        return 0
    fi

    magick "$src" -quality "$AVIF_QUALITY" "$out"
}

encode_webp() {
    local src="$1" out="$2"
    if [[ "$HAS_CWEBP" == "true" ]]; then
        cwebp -quiet -q "$WEBP_QUALITY" -m 6 -alpha_q 100 "$src" -o "$out"

        return 0
    fi

    magick "$src" -quality "$WEBP_QUALITY" -define webp:method=6 "$out"
}

TOTAL=0
ENCODED=0
SKIPPED=0
OVER_BUDGET=()

printf '%-64s %10s %10s %10s %8s\n' 'asset' 'png' 'avif' 'webp' 'budget'

while IFS= read -r png_path; do
    relative_path="${png_path#"$MEDIA_ROOT"/}"
    file_name="$(basename "$png_path")"
    asset_name="${file_name%@2x.png}"
    scene_name="${asset_name%-ipad}"
    target_width="$WIDTH_IPHONE"
    if [[ "$asset_name" == *-ipad ]]; then
        target_width="$WIDTH_IPAD"
    fi

    scene_is_selected "$scene_name" || continue
    TOTAL=$((TOTAL + 1))

    avif_path="${png_path%.png}.avif"
    webp_path="${png_path%.png}.webp"
    avif_budget="$(scene_budget_bytes "$scene_name")"
    webp_budget=$(awk -v b="$avif_budget" -v r="$WEBP_BUDGET_RATIO" 'BEGIN { printf "%d", b * r }')

    if [[ "$DRY_RUN" == "true" ]]; then
        printf '%-64s %10s %10s %10s %8s\n' "$relative_path" \
            "$(kilobytes "$(file_bytes "$png_path")")K" \
            "$(kilobytes "$(file_bytes "$avif_path")")K" \
            "$(kilobytes "$(file_bytes "$webp_path")")K" \
            "$(kilobytes "$avif_budget")K"

        continue
    fi

    # Idempotent: an encode is redone only when the staged PNG is newer than the
    # committed binary, so re-running over a full media tree costs a stat call
    # per file instead of thousands of AV1 encodes.
    if [[ "$FORCE" == "false" && -f "$avif_path" && -f "$webp_path" &&
        "$avif_path" -nt "$png_path" && "$webp_path" -nt "$png_path" ]]; then
        SKIPPED=$((SKIPPED + 1))
    else
        scaled="$WORK_ROOT/scaled-$$-$RANDOM.png"
        magick "$png_path" -resize "${target_width}x" -define png:color-type=6 -depth 8 "$scaled"
        encode_avif "$scaled" "$avif_path"
        encode_webp "$scaled" "$webp_path"
        rm -f "$scaled"
        ENCODED=$((ENCODED + 1))
    fi

    avif_bytes="$(file_bytes "$avif_path")"
    webp_bytes="$(file_bytes "$webp_path")"
    status='ok'
    if ((avif_bytes > avif_budget)); then
        status='OVER'
        OVER_BUDGET+=("$relative_path avif $(kilobytes "$avif_bytes")K > $(kilobytes "$avif_budget")K")
    fi
    if ((webp_bytes > webp_budget)); then
        status='OVER'
        OVER_BUDGET+=("$relative_path webp $(kilobytes "$webp_bytes")K > $(kilobytes "$webp_budget")K")
    fi

    printf '%-64s %10s %10s %10s %8s %s\n' "$relative_path" \
        "$(kilobytes "$(file_bytes "$png_path")")K" \
        "$(kilobytes "$avif_bytes")K" \
        "$(kilobytes "$webp_bytes")K" \
        "$(kilobytes "$avif_budget")K" \
        "$status"
done < <(find "$MEDIA_ROOT" -type f -name '*@2x.png' | sort)

if ((TOTAL == 0)); then
    fail "no staged '*@2x.png' found under $MEDIA_ROOT - run compose-web-media.sh first"
fi

echo "encoded $ENCODED, up to date $SKIPPED, total $TOTAL (avif: $([[ "$HAS_AVIFENC" == "true" ]] && echo avifenc || echo magick), webp: $([[ "$HAS_CWEBP" == "true" ]] && echo cwebp || echo magick))"

if ((${#OVER_BUDGET[@]} > 0)); then
    echo "error: ${#OVER_BUDGET[@]} asset(s) over budget:" >&2
    printf '  %s\n' "${OVER_BUDGET[@]}" >&2
    exit 1
fi

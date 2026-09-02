#!/usr/bin/env bash
#
# Compose landing-site product imagery from the same raw captures the store
# pipeline uses, with ImageMagick 7 and fastlane frameit's real device frames.
#
# This is the web sibling of compose-screenshots.sh. Both share the frameit
# cache lookup, the device frame geometry, the ASC -> app locale mapping and the
# capture-into-cutout compositing step through frame-device.sh; what differs is
# everything after the frame:
#
#   * transparent background outside the device - the landing supplies its own
#     gradient and shadow in CSS,
#   * no caption stack - the landing renders its copy in HTML so it stays
#     translatable and indexable,
#   * no palette plate and no drop shadow,
#   * output at the exact pixel size of the raw capture, framed device contained
#     and centred inside it.
#
# `--frame raw` skips the device frame entirely and emits the capture at its own
# size with an optional rounded-corner alpha mask, for the cropped close-ups
# (a suggestion chip, a budget ring) the landing insets into copy.
#
# One-time setup - download the frame assets (cached at ~/.fastlane/frameit):
#
#   fastlane frameit download_frames
#
# Usage:
#   packages/app/fastlane/screenshots/design/compose-web-media.sh \
#       <app-locale|all> <light|dark|all> [options]
#
#   --frame device|raw       device frame (default) or unframed rounded crop
#   --device iphone|ipad|all which capture device to compose (default all)
#   --scenes <a,b>           only these scenes (default: every mapped scene)
#   --radius <px|auto|0>     raw-mode corner radius (default auto = 9% of width)
#   --groups <path>          scene -> route slug map (default web-media-groups.json)
#   --raw-dir <dir>          raw capture root (default ../landing-raw)
#   --output <dir>           media root (default packages/landing/public/media)
#
# Raw captures are read from the layout mobile-ci's capture-screenshots-ios
# action and tests/app-tests/scripts/capture-store-screenshots.sh both write:
#
#   <raw-dir>/ios/<device-slug>/<app-locale>/<appearance>/<scene>.png
#
# and staged, one copy per landing route slug the scene feeds, to:
#
#   <output>/<group>/<locale>/<theme>/<scene>@2x.png
#   <output>/<group>/<locale>/<theme>/<scene>-ipad@2x.png
#
# ready for encode-web-media.sh. A scene with no raw capture yet is skipped with
# a note, because the storyboard lands in stages; the run fails only when it
# composed nothing at all.
set -euo pipefail

DESIGN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./frame-device.sh
source "$DESIGN_DIR/frame-device.sh"
SCREENSHOTS_DIR="$(cd "$DESIGN_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCREENSHOTS_DIR/../../.." && pwd)"

RAW_ROOT="${WEB_MEDIA_RAW_DIR:-$SCREENSHOTS_DIR/landing-raw}"
OUTPUT_ROOT="${WEB_MEDIA_OUTPUT_DIR:-$REPO_ROOT/packages/landing/public/media}"
GROUPS_PATH="$DESIGN_DIR/web-media-groups.json"

fail() {
    echo "error: $*" >&2
    exit 1
}

# The two positional arguments mirror compose-screenshots.sh's <locale> <variant>
# shape; an option in their place is a typo, not an omission.
for positional in "${1:-all}" "${2:-all}"; do
    case "$positional" in
        --*) fail "expected '<app-locale|all> <light|dark|all>' before the options, got '$positional'. See --help." ;;
    esac
done

LOCALE_ARGUMENT="${1:-all}"
VARIANT_ARGUMENT="${2:-all}"
shift $(($# < 2 ? $# : 2))

FRAME_ARGUMENT='device'
DEVICE_ARGUMENT='all'
SCENES_ARGUMENT=''
RADIUS_ARGUMENT='auto'

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --frame)
            FRAME_ARGUMENT="${2:-}"
            shift 2
            ;;
        --device)
            DEVICE_ARGUMENT="${2:-}"
            shift 2
            ;;
        --scenes)
            SCENES_ARGUMENT="${2:-}"
            shift 2
            ;;
        --radius)
            RADIUS_ARGUMENT="${2:-}"
            shift 2
            ;;
        --groups)
            GROUPS_PATH="${2:-}"
            shift 2
            ;;
        --raw-dir)
            RAW_ROOT="${2:-}"
            shift 2
            ;;
        --output)
            OUTPUT_ROOT="${2:-}"
            shift 2
            ;;
        -h | --help)
            sed -n '2,50p' "$0"
            exit 0
            ;;
        *)
            fail "unknown argument '$1'. See --help."
            ;;
    esac
done

case "$FRAME_ARGUMENT" in
    device | raw) ;;
    *) fail "unknown frame mode '$FRAME_ARGUMENT'. Use device or raw." ;;
esac
case "$VARIANT_ARGUMENT" in
    light | dark | all) ;;
    *) fail "unknown variant '$VARIANT_ARGUMENT'. Use light, dark, or all." ;;
esac
case "$DEVICE_ARGUMENT" in
    iphone | ipad | all) ;;
    *) fail "unknown device '$DEVICE_ARGUMENT'. Use iphone, ipad, or all." ;;
esac
case "$RADIUS_ARGUMENT" in
    auto | '' | *[!0-9]*)
        [[ "$RADIUS_ARGUMENT" == "auto" ]] || fail "--radius must be 'auto' or a non-negative integer, got '$RADIUS_ARGUMENT'"
        ;;
esac

command -v magick >/dev/null 2>&1 || fail "ImageMagick 7 ('magick') is required on PATH"
command -v jq >/dev/null 2>&1 || fail "'jq' is required to read $GROUPS_PATH"
[[ -f "$GROUPS_PATH" ]] || fail "no scene group map at $GROUPS_PATH"
jq -e . "$GROUPS_PATH" >/dev/null 2>&1 || fail "$GROUPS_PATH is not valid JSON"

ALL_LOCALES=(en fr uk de es)
SELECTED_LOCALES=()
if [[ "$LOCALE_ARGUMENT" == "all" ]]; then
    SELECTED_LOCALES=("${ALL_LOCALES[@]}")
else
    SELECTED_LOCALES=("$(raw_locale_for "$LOCALE_ARGUMENT")")
fi

SELECTED_VARIANTS=("$VARIANT_ARGUMENT")
if [[ "$VARIANT_ARGUMENT" == "all" ]]; then
    SELECTED_VARIANTS=(light dark)
fi

# `raw` mode never touches a device frame, so a machine without the frameit
# cache can still produce the unframed crops.
if [[ "$FRAME_ARGUMENT" == "device" ]]; then
    resolve_frameit_frames_dir
    resolve_device_frames
else
    IPHONE_DEVICE_SLUG='iphone-17-pro-max'
    IPAD_DEVICE_SLUG='ipad-pro-13-inch-m4'
fi

WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/budgie-web-media.XXXXXX")"
trap 'rm -rf "$WORK_ROOT"' EXIT

RAW_CORNER_RADIUS_FRACTION='0.09'

scene_names() {
    jq -r '.scenes | keys_unsorted[]' "$GROUPS_PATH"
}

scene_groups() {
    jq -r --arg scene "$1" '.scenes[$scene].groups[]' "$GROUPS_PATH"
}

scene_devices() {
    jq -r --arg scene "$1" '(.scenes[$scene].devices // ["iphone"])[]' "$GROUPS_PATH"
}

scene_is_selected() {
    [[ -n "$SCENES_ARGUMENT" ]] || return 0

    printf '%s' "$SCENES_ARGUMENT" | tr ',' '\n' | grep -qFx "$1"
}

# Contains the framed device inside a transparent canvas of exactly the raw
# capture's pixel size: `-resize WxH` without `!` preserves the frame's aspect,
# so the device is scaled to whichever axis binds and centred, and every pixel
# the device does not cover stays fully transparent for the landing's own
# background to show through.
compose_device_frame() {
    local src="$1" frame_file="$2" cutout_x="$3" cutout_y="$4" cutout_w="$5" cutout_h="$6" out="$7"
    local canvas_w canvas_h framed

    canvas_w="$(magick identify -format "%w" "$src")"
    canvas_h="$(magick identify -format "%h" "$src")"
    if ((canvas_w >= canvas_h)); then
        fail "raw capture $src is ${canvas_w}x${canvas_h}; only portrait captures are supported"
    fi

    framed="$WORK_ROOT/framed-$$-$RANDOM.png"
    frame_capture "$src" "$frame_file" "$cutout_x" "$cutout_y" "$cutout_w" "$cutout_h" "$framed"
    magick -size "${canvas_w}x${canvas_h}" xc:none \
        \( "$framed" -resize "${canvas_w}x${canvas_h}" \) \
        -gravity center -compose Over -composite \
        -define png:color-type=6 -depth 8 "$out"
    rm -f "$framed"
}

# Unframed pass-through at the capture's own size, with an optional rounded
# corner alpha mask so a cropped close-up sits on the landing without a hard
# rectangle edge. `--radius 0` keeps the square corners.
compose_raw_crop() {
    local src="$1" out="$2"
    local canvas_w canvas_h radius mask

    canvas_w="$(magick identify -format "%w" "$src")"
    canvas_h="$(magick identify -format "%h" "$src")"
    radius="$RADIUS_ARGUMENT"
    if [[ "$radius" == "auto" ]]; then
        radius=$(awk -v w="$canvas_w" -v f="$RAW_CORNER_RADIUS_FRACTION" 'BEGIN { printf "%d", w * f }')
    fi

    if [[ "$radius" == "0" ]]; then
        magick "$src" -alpha set -define png:color-type=6 -depth 8 "$out"

        return 0
    fi

    mask="$WORK_ROOT/round-mask-$$-$RANDOM.png"
    magick -size "${canvas_w}x${canvas_h}" xc:black -fill white \
        -draw "roundrectangle 0,0 $((canvas_w - 1)),$((canvas_h - 1)) ${radius},${radius}" \
        -alpha off -define png:color-type=0 -depth 8 "$mask"
    magick "$src" "$mask" -alpha off -compose CopyOpacity -composite \
        -define png:color-type=6 -depth 8 "$out"
    rm -f "$mask"
}

COMPOSED_COUNT=0
SKIPPED_COUNT=0

compose_cell() {
    local scene="$1" device="$2" locale="$3" variant="$4"
    local device_slug frame_file cutout_x cutout_y cutout_w cutout_h
    local src staged out_name group destination

    case "$device" in
        iphone)
            device_slug="$IPHONE_DEVICE_SLUG"
            frame_file="${IPHONE_FRAME:-}"
            cutout_x="${IPHONE_CUTOUT_X:-0}"
            cutout_y="${IPHONE_CUTOUT_Y:-0}"
            cutout_w="${IPHONE_CUTOUT_W:-0}"
            cutout_h="${IPHONE_CUTOUT_H:-0}"
            out_name="$scene@2x.png"
            ;;
        ipad)
            device_slug="$IPAD_DEVICE_SLUG"
            frame_file="${IPAD_FRAME:-}"
            cutout_x="${IPAD_CUTOUT_X:-0}"
            cutout_y="${IPAD_CUTOUT_Y:-0}"
            cutout_w="${IPAD_CUTOUT_W:-0}"
            cutout_h="${IPAD_CUTOUT_H:-0}"
            out_name="$scene-ipad@2x.png"
            ;;
        *)
            fail "unknown device '$device' for scene '$scene'"
            ;;
    esac

    src="$RAW_ROOT/ios/$device_slug/$locale/$variant/$scene.png"
    if [[ ! -f "$src" ]]; then
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        echo "note: no raw capture for $device/$locale/$variant/$scene yet ($src)"

        return 0
    fi

    staged="$WORK_ROOT/staged-$$-$RANDOM.png"
    if [[ "$FRAME_ARGUMENT" == "device" ]]; then
        compose_device_frame "$src" "$frame_file" "$cutout_x" "$cutout_y" "$cutout_w" "$cutout_h" "$staged"
    else
        compose_raw_crop "$src" "$staged"
    fi

    # One capture, many landing routes: the scene is written once per group it
    # feeds, so a page resolves its media from its own slug and the manifest
    # never needs a cross-route alias table.
    while IFS= read -r group; do
        [[ -n "$group" ]] || continue
        destination="$OUTPUT_ROOT/$group/$locale/$variant"
        mkdir -p "$destination"
        cp "$staged" "$destination/$out_name"
        COMPOSED_COUNT=$((COMPOSED_COUNT + 1))
        echo "wrote $destination/$out_name"
    done < <(scene_groups "$scene")

    rm -f "$staged"
}

for scene_name in $(scene_names); do
    scene_is_selected "$scene_name" || continue
    for scene_device in $(scene_devices "$scene_name"); do
        if [[ "$DEVICE_ARGUMENT" != "all" && "$DEVICE_ARGUMENT" != "$scene_device" ]]; then
            continue
        fi
        for compose_locale in "${SELECTED_LOCALES[@]}"; do
            for compose_variant in "${SELECTED_VARIANTS[@]}"; do
                compose_cell "$scene_name" "$scene_device" "$compose_locale" "$compose_variant"
            done
        done
    done
done

if ((COMPOSED_COUNT == 0)); then
    fail "composed nothing: no raw capture matched under $RAW_ROOT/ios (skipped $SKIPPED_COUNT cell(s))"
fi

echo "composed $COMPOSED_COUNT file(s) into $OUTPUT_ROOT, skipped $SKIPPED_COUNT uncaptured cell(s)"

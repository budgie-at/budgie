#!/usr/bin/env bash
# Shared frameit plumbing sourced by compose-screenshots.sh and compose-web-media.sh; callers must set WORK_ROOT before calling frame_capture.

raw_locale_for() {
    case "$1" in
        en-US) echo 'en' ;;
        fr-FR) echo 'fr' ;;
        de-DE) echo 'de' ;;
        es-ES) echo 'es' ;;
        uk) echo 'uk' ;;
        *) echo "$1" ;;
    esac
}

resolve_frameit_frames_dir() {
    local candidate
    FRAMES_DIR=''
    for candidate in "$HOME/.fastlane/frameit/latest" "$HOME/.frameit/latest"; do
        if [[ -d "$candidate" ]]; then
            FRAMES_DIR="$candidate"
            break
        fi
    done
    if [[ -z "$FRAMES_DIR" ]]; then
        echo "error: fastlane frameit device frames not found. Run 'fastlane frameit download_frames' first (downloads to ~/.fastlane/frameit/latest)." >&2
        exit 1
    fi
}

resolve_device_frames() {
    local frame_file

    IPHONE_FRAME="$FRAMES_DIR/Apple iPhone 16 Pro Max Black Titanium.png"
    IPHONE_DEVICE_SLUG='iphone-17-pro-max'
    IPHONE_CUTOUT_X=75
    IPHONE_CUTOUT_Y=66
    IPHONE_CUTOUT_W=1320
    IPHONE_CUTOUT_H=2868

    IPAD_FRAME="$FRAMES_DIR/Apple iPad Pro (12.9-inch) (4th generation) Space Gray.png"
    IPAD_DEVICE_SLUG='ipad-pro-13-inch-m4'
    IPAD_CUTOUT_X=96
    IPAD_CUTOUT_Y=102
    IPAD_CUTOUT_W=2048
    IPAD_CUTOUT_H=2732

    for frame_file in "$IPHONE_FRAME" "$IPAD_FRAME"; do
        if [[ ! -f "$frame_file" ]]; then
            echo "error: missing frame asset '$frame_file' - re-run 'fastlane frameit download_frames'" >&2
            exit 1
        fi
    done
}

frame_capture() {
    local src="$1" frame_file="$2" cutout_x="$3" cutout_y="$4" cutout_w="$5" cutout_h="$6" out="$7"
    local frame_native_w frame_native_h cutout_mask
    frame_native_w="$(magick identify -format "%w" "$frame_file")"
    frame_native_h="$(magick identify -format "%h" "$frame_file")"
    cutout_mask="$WORK_ROOT/cutout-mask-$$-$RANDOM.png"
    magick "$frame_file" -alpha extract -fuzz 50% -fill white -floodfill +0+0 black -negate \
        \( -size "${frame_native_w}x${frame_native_h}" xc:black -fill white \
        -draw "rectangle ${cutout_x},${cutout_y} $((cutout_x + cutout_w - 1)),$((cutout_y + cutout_h - 1))" \) \
        -compose Multiply -composite -define png:color-type=0 -depth 8 "$cutout_mask"
    magick -size "${frame_native_w}x${frame_native_h}" xc:none \
        \( "$src" -resize "${cutout_w}x${cutout_h}!" \) -geometry "+${cutout_x}+${cutout_y}" -compose Over -composite \
        "$cutout_mask" -compose CopyOpacity -composite \
        "$frame_file" -compose Over -composite \
        -define png:color-type=6 -depth 8 "$out"
    rm -f "$cutout_mask"
}

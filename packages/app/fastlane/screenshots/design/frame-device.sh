#!/usr/bin/env bash
#
# Shared frameit plumbing for the two compose scripts in this directory:
# compose-screenshots.sh (App Store, captioned, opaque palette plate) and
# compose-web-media.sh (landing, transparent, caption-free).
#
# It is sourced, never executed: it defines the frameit cache lookup, the two
# device frame geometries, the App Store Connect -> app locale mapping and the
# capture-into-cutout compositing step, so neither compose script carries its
# own copy of any of them.
#
# Callers must define WORK_ROOT (a scratch directory they own and clean up)
# before calling frame_capture.

# App Store Connect locale folder -> the app locale the capture runner writes
# raw screenshots under. Apple has no regional Ukrainian, so uk maps to itself.
# An app locale passed straight in (en, fr, uk, de, es) falls through unchanged,
# which is what the landing pipeline needs.
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

# fastlane moved its frameit cache from ~/.frameit to ~/.fastlane/frameit at
# some point; accept either so this keeps working on older fastlane installs.
# Sets FRAMES_DIR.
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

# Sets IPHONE_/IPAD_ frame paths, device slugs and screen cutout rectangles from
# an already-resolved FRAMES_DIR, and fails closed on a missing frame asset.
#
# The store's primary iPhone slot is 6.9" (1320x2868), the Pro Max panel. Apple
# ships no black iPhone 17 Pro Max, and the only 17 Pro Max frames are Cosmic
# Orange / Deep Blue / Silver, none of which sit well next to Budgie's
# monochrome brand. The 16 Pro Max Black Titanium frame carries the identical
# panel geometry, so it keeps a black device while hitting the 6.9" slot
# exactly: 1470-(2*75)=1320 and 3000-(2*66)=2868.
#
# The 13" M4 iPad Pro is not in frameit-frames yet (a community-maintained asset
# set); the 12.9" iPad Pro (4th generation) is the closest match - same
# edge-to-edge Face ID design with no home button and the same 4:3 panel ratio,
# just a slightly older panel. Its cutout (2048x2732 at +96+102 inside a
# 2245x2930 canvas) was measured directly off the PNG's alpha channel and is
# resized ~0.8% to the 2064x2752 iPad 13" capture; the aspect ratio matches to
# 0.05%, so the resize is imperceptible and never crops.
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

# Resizes a raw capture into a frame PNG's real transparent screen cutout and
# layers the frame on top, so the frame's own bezel (including the rounded
# corner overlap) covers the capture's square corners. Nothing is cropped:
# resizing with "!" fills the cutout exactly and the frame only adds bezel.
# The cutout's bounding box overlaps the frame's transparent outer corner region
# (the device's outer radius is larger than the screen's), so the capture is
# clipped to the frame's *enclosed* opening: flood-fill the border-connected
# transparent region out of the alpha mask, then intersect with the cutout
# rectangle, so only the screen opening keeps capture pixels.
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

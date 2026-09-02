#!/bin/bash
# Verifies encode-media-clips.sh resolves its plan from the committed clip map,
# honours the CLI overrides, and produces the WebM + MP4 + WebP delivery set inside
# the byte budgets.
# The plan checks run anywhere. The real encode runs against a synthetic ffmpeg-
# generated clip and is skipped, not failed, when ffmpeg is unavailable.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TARGET="$SCRIPT_DIR/encode-media-clips.sh"
CLIP_MAP="$SCRIPT_DIR/../flows/media/clip-routes.json"
FLOWS_DIR="$SCRIPT_DIR/../flows/media"
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

FAILURES=0

assert_contains() {
    local haystack="$1" needle="$2" label="$3"
    if printf '%s' "$haystack" | grep -qF -- "$needle"; then
        echo "ok   $label"
    else
        echo "FAIL $label: expected to find '$needle'"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_missing() {
    local haystack="$1" needle="$2" label="$3"
    if printf '%s' "$haystack" | grep -qF -- "$needle"; then
        echo "FAIL $label: did not expect '$needle'"
        FAILURES=$((FAILURES + 1))
    else
        echo "ok   $label"
    fi
}

assert_fails() {
    local label="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        echo "FAIL $label: expected a non-zero exit"
        FAILURES=$((FAILURES + 1))
    else
        echo "ok   $label"
    fi
}

assert_file() {
    if [ -f "$1" ]; then
        echo "ok   $2"
    else
        echo "FAIL $2: $1 is missing"
        FAILURES=$((FAILURES + 1))
    fi
}

# The clip map is the contract between the recorder, the encoder and the landing
# manifest: every recorded clip must have a route slug to be delivered under.
MAP_CLIPS=$(jq -r '.clips | keys[]' "$CLIP_MAP" | sort)
WRAPPER_CLIPS=$(find "$FLOWS_DIR" -name '*.record.flow.yaml' -exec basename {} .record.flow.yaml \; | sort)
if [ "$MAP_CLIPS" = "$WRAPPER_CLIPS" ]; then
    echo 'ok   the clip map covers exactly the record wrappers'
else
    printf '%s\n' "$MAP_CLIPS" "$WRAPPER_CLIPS" | sort | uniq -u
    echo 'FAIL the clip map and the record wrappers disagree'
    FAILURES=$((FAILURES + 1))
fi

INCOMPLETE=$(jq -r '.clips | to_entries[] | select((.value.route // "") == "" or (.value.durationSeconds // null) == null or (.value.posterSeconds // null) == null) | .key' "$CLIP_MAP")
if [ -z "$INCOMPLETE" ]; then
    echo 'ok   every clip carries a route, a duration and a poster timestamp'
else
    printf '%s\n' "$INCOMPLETE"
    echo 'FAIL a clip is missing its route, duration or poster timestamp'
    FAILURES=$((FAILURES + 1))
fi

LATE_POSTERS=$(jq -r '.clips | to_entries[] | select(.value.posterSeconds >= .value.durationSeconds) | .key' "$CLIP_MAP")
if [ -z "$LATE_POSTERS" ]; then
    echo 'ok   every poster timestamp falls inside its clip'
else
    printf '%s\n' "$LATE_POSTERS"
    echo 'FAIL a poster timestamp falls outside its clip'
    FAILURES=$((FAILURES + 1))
fi

PLAN=$(bash "$TARGET" --dry-run)
assert_contains "$PLAN" 'theme-toggle -> dark-mode (2s, poster 0.8s)' 'clip rows resolve route, duration and poster'
assert_contains "$PLAN" 'voice-entry -> voice-transaction-entry' 'the hero clip maps to its owning route'
assert_contains "$PLAN" 'webm codec: av1' 'AV1 is the default WebM codec'
assert_contains "$PLAN" 'loop crossfade: 150ms' 'the loop crossfade comes from the map'
assert_contains "$PLAN" 'width: 900' 'the downscale width comes from the map'
assert_contains "$PLAN" 'gif: never' 'GIF is never an output'

VP9_PLAN=$(bash "$TARGET" --dry-run --vp9 --no-scale --width 640 --loop-crossfade 0 --clips theme-toggle)
assert_contains "$VP9_PLAN" 'webm codec: vp9' '--vp9 selects the fallback codec'
assert_contains "$VP9_PLAN" 'width: source' '--no-scale keeps the capture resolution'
assert_contains "$VP9_PLAN" 'loop crossfade: 0ms' '--loop-crossfade 0 disables the seam blend'
assert_missing "$VP9_PLAN" 'voice-entry' '--clips filters other clips'

assert_fails 'unknown argument fails closed' bash "$TARGET" --dry-run --nope
assert_fails 'unknown clip fails closed' bash "$TARGET" --dry-run --clips no-such-clip
assert_fails 'non-integer --width fails closed' bash "$TARGET" --dry-run --width wide
assert_fails 'non-integer --loop-crossfade fails closed' bash "$TARGET" --dry-run --loop-crossfade soon
assert_fails 'missing map fails closed' bash "$TARGET" --dry-run --map "$WORK_DIR/absent.json"
assert_fails 'missing raw input fails closed' bash "$TARGET" --input "$WORK_DIR/absent" --clips theme-toggle

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo 'skip encode round-trip: ffmpeg is not installed'
    if [ "$FAILURES" -eq 0 ]; then
        echo 'encode-media-clips.sh: all checks passed'
        exit 0
    fi
    echo "encode-media-clips.sh: $FAILURES check(s) failed"
    exit 1
fi

# Synthetic 2s capture-shaped source, so the round trip exercises the real ffmpeg
# graph without needing a simulator recording.
RAW_DIR="$WORK_DIR/raw/theme-toggle/en/dark"
mkdir -p "$RAW_DIR"
ffmpeg -nostdin -y -hide_banner -loglevel error \
    -f lavfi -i 'testsrc=size=660x1434:rate=30:duration=2' \
    -c:v libx264 -pix_fmt yuv420p "$RAW_DIR/raw.mp4"

ENCODE_OUTPUT="$WORK_DIR/media"
ENCODE_LOG=$(bash "$TARGET" --input "$WORK_DIR/raw" --output "$ENCODE_OUTPUT" --clips theme-toggle --vp9 2>&1) || {
    printf '%s\n' "$ENCODE_LOG"
    echo 'FAIL the encode round trip failed'
    FAILURES=$((FAILURES + 1))
}

assert_contains "$ENCODE_LOG" 'dark-mode/en/dark/theme-toggle' 'the cell lands under its route slug, locale and theme'
assert_file "$ENCODE_OUTPUT/dark-mode/en/dark/theme-toggle.webm" 'the WebM is produced'
assert_file "$ENCODE_OUTPUT/dark-mode/en/dark/theme-toggle.mp4" 'the MP4 is produced'
assert_file "$ENCODE_OUTPUT/dark-mode/en/dark/theme-toggle.webp" 'the WebP poster is produced'
assert_file "$ENCODE_OUTPUT/dark-mode/en/dark/theme-toggle.animated.webp" 'a sub-2s clip also gets an animated WebP'

GIFS=$(find "$ENCODE_OUTPUT" -name '*.gif' | wc -l | tr -d ' ')
if [ "$GIFS" -eq 0 ]; then
    echo 'ok   no GIF is ever written'
else
    echo "FAIL $GIFS GIF(s) were written"
    FAILURES=$((FAILURES + 1))
fi

# The delivery MP4 must be progressive-download ready, which is what +faststart buys.
if ffmpeg -nostdin -hide_banner -loglevel error -v trace -i "$ENCODE_OUTPUT/dark-mode/en/dark/theme-toggle.mp4" -f null - 2>&1 | grep -q 'moov'; then
    echo 'ok   the MP4 carries a moov atom'
else
    echo 'FAIL the MP4 has no readable moov atom'
    FAILURES=$((FAILURES + 1))
fi

DOWNSCALED_WIDTH=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$ENCODE_OUTPUT/dark-mode/en/dark/theme-toggle.mp4" 2>/dev/null || echo '')
if [ "$DOWNSCALED_WIDTH" = '660' ]; then
    echo 'ok   a source narrower than the target width is not upscaled'
else
    echo "FAIL expected the 660px source to stay 660px, got '$DOWNSCALED_WIDTH'"
    FAILURES=$((FAILURES + 1))
fi

# A budget of one byte must fail the run, and --allow-oversize must downgrade it.
TIGHT_MAP="$WORK_DIR/tight-map.json"
jq '.budgets.webmBytes = 1 | .budgets.mp4Bytes = 1 | .budgets.posterBytes = 1' "$CLIP_MAP" > "$TIGHT_MAP"
assert_fails 'a blown byte budget fails the run' bash "$TARGET" --input "$WORK_DIR/raw" --output "$WORK_DIR/tight" --map "$TIGHT_MAP" --clips theme-toggle --vp9
if bash "$TARGET" --input "$WORK_DIR/raw" --output "$WORK_DIR/tight-allowed" --map "$TIGHT_MAP" --clips theme-toggle --vp9 --allow-oversize >/dev/null 2>&1; then
    echo 'ok   --allow-oversize downgrades a blown budget to a warning'
else
    echo 'FAIL --allow-oversize should not fail the run'
    FAILURES=$((FAILURES + 1))
fi

if [ "$FAILURES" -eq 0 ]; then
    echo 'encode-media-clips.sh: all checks passed'
else
    echo "encode-media-clips.sh: $FAILURES check(s) failed"
    exit 1
fi

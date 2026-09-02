#!/bin/bash
# Verifies encode-web-media.sh turns staged landing PNGs into AVIF + WebP at the
# right widths, prints a size table, stays idempotent across runs, and fails
# loudly when an asset breaks its byte budget.
# Runs anywhere: the staged PNGs are synthesised with ImageMagick, and the
# encoders fall back to ImageMagick's own delegates when avifenc/cwebp are
# absent, so no simulator and no extra tooling are needed.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
TARGET="$REPO_ROOT/packages/app/fastlane/screenshots/design/encode-web-media.sh"

if ! command -v magick >/dev/null 2>&1; then
    echo "skip test-encode-web-media: ImageMagick 7 ('magick') is not installed"

    exit 0
fi
if ! command -v jq >/dev/null 2>&1; then
    echo "skip test-encode-web-media: 'jq' is not installed"

    exit 0
fi
if ! magick -list format 2>/dev/null | grep -qiE '^ *AVIF ' && ! command -v avifenc >/dev/null 2>&1; then
    echo "skip test-encode-web-media: no AVIF encoder (avifenc or an ImageMagick AVIF delegate)"

    exit 0
fi

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

FAILURES=0

pass() {
    echo "ok   $1"
}

assert_equals() {
    local label="$1" actual="$2" expected="$3"
    if [ "$actual" = "$expected" ]; then
        pass "$label"
    else
        echo "FAIL $label: expected '$expected', got '$actual'"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_file() {
    local label="$1" path="$2"
    if [ -s "$path" ]; then
        pass "$label"
    else
        echo "FAIL $label: no non-empty file at $path"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_contains() {
    local haystack="$1" needle="$2" label="$3"
    if printf '%s' "$haystack" | grep -qF -- "$needle"; then
        pass "$label"
    else
        echo "FAIL $label: expected to find '$needle'"
        FAILURES=$((FAILURES + 1))
    fi
}

GROUPS_MAP="$WORK_DIR/groups.json"
cat > "$GROUPS_MAP" <<'JSON'
{
    "scenes": {
        "home-hero-1": { "groups": ["home"], "devices": ["iphone", "ipad"], "budget": "hero" },
        "pin-app-lock-1": { "groups": ["pin-app-lock"] }
    }
}
JSON

MEDIA_DIR="$WORK_DIR/media"
mkdir -p "$MEDIA_DIR/home/en/light" "$MEDIA_DIR/pin-app-lock/en/dark"
# Flat gradients over a transparent margin: the same shape a framed capture has,
# and small enough for AV1 to stay well inside the feature budget.
magick -size 1320x2868 xc:none \
    \( -size 1100x2400 gradient:'#3366FF-#FFFFFF' \) -gravity center -composite \
    "$MEDIA_DIR/home/en/light/home-hero-1@2x.png"
magick -size 2064x2752 xc:none \
    \( -size 1800x2300 gradient:'#3366FF-#FFFFFF' \) -gravity center -composite \
    "$MEDIA_DIR/home/en/light/home-hero-1-ipad@2x.png"
magick -size 1320x2868 xc:none \
    \( -size 1100x2400 gradient:'#22AA55-#101820' \) -gravity center -composite \
    "$MEDIA_DIR/pin-app-lock/en/dark/pin-app-lock-1@2x.png"

FIRST_RUN="$(bash "$TARGET" --media-dir "$MEDIA_DIR" --groups "$GROUPS_MAP" 2>&1)"

assert_file 'iPhone hero AVIF is written' "$MEDIA_DIR/home/en/light/home-hero-1@2x.avif"
assert_file 'iPhone hero WebP is written' "$MEDIA_DIR/home/en/light/home-hero-1@2x.webp"
assert_file 'iPad hero AVIF is written' "$MEDIA_DIR/home/en/light/home-hero-1-ipad@2x.avif"
assert_file 'feature scene AVIF is written' "$MEDIA_DIR/pin-app-lock/en/dark/pin-app-lock-1@2x.avif"
assert_file 'feature scene WebP is written' "$MEDIA_DIR/pin-app-lock/en/dark/pin-app-lock-1@2x.webp"

assert_contains "$FIRST_RUN" 'asset' 'the size table is printed'
assert_contains "$FIRST_RUN" 'home/en/light/home-hero-1@2x.png' 'the size table lists each asset by its media-relative path'
assert_contains "$FIRST_RUN" 'encoded 3' 'the run reports how many assets it encoded'

assert_equals 'framed iPhone assets are encoded at the iPhone target width' \
    "$(magick identify -format "%w" "$MEDIA_DIR/home/en/light/home-hero-1@2x.webp")" '900'
assert_equals 'framed iPad assets are encoded at the iPad target width' \
    "$(magick identify -format "%w" "$MEDIA_DIR/home/en/light/home-hero-1-ipad@2x.webp")" '1024'

SECOND_RUN="$(bash "$TARGET" --media-dir "$MEDIA_DIR" --groups "$GROUPS_MAP" 2>&1)"
assert_contains "$SECOND_RUN" 'encoded 0, up to date 3' 'a second run re-encodes nothing'

FORCED_RUN="$(bash "$TARGET" --media-dir "$MEDIA_DIR" --groups "$GROUPS_MAP" --force 2>&1)"
assert_contains "$FORCED_RUN" 'encoded 3, up to date 0' '--force re-encodes everything'

SELECTED_RUN="$(bash "$TARGET" --media-dir "$MEDIA_DIR" --groups "$GROUPS_MAP" --scenes pin-app-lock-1 --force 2>&1)"
assert_contains "$SELECTED_RUN" 'encoded 1' '--scenes narrows the run'

DRY_RUN="$(bash "$TARGET" --media-dir "$MEDIA_DIR" --groups "$GROUPS_MAP" --dry-run 2>&1)"
assert_contains "$DRY_RUN" 'home/en/light/home-hero-1@2x.png' '--dry-run still prints the size table'
assert_contains "$DRY_RUN" 'encoded 0' '--dry-run encodes nothing'

WEB_MEDIA_FEATURE_AVIF_KB=1 WEB_MEDIA_HERO_AVIF_KB=1 \
    bash "$TARGET" --media-dir "$MEDIA_DIR" --groups "$GROUPS_MAP" --force > "$WORK_DIR/over-budget.log" 2>&1 &&
    BUDGET_EXIT=0 || BUDGET_EXIT=$?
if [ "$BUDGET_EXIT" -ne 0 ] && grep -qF 'over budget' "$WORK_DIR/over-budget.log"; then
    pass 'an over-budget asset fails the run'
else
    echo "FAIL an over-budget asset fails the run (exit $BUDGET_EXIT)"
    FAILURES=$((FAILURES + 1))
fi
assert_contains "$(cat "$WORK_DIR/over-budget.log")" 'OVER' 'the over-budget asset is flagged in the table'

if bash "$TARGET" --media-dir "$WORK_DIR/empty-media" --groups "$GROUPS_MAP" >/dev/null 2>&1; then
    echo "FAIL a missing media directory fails closed"
    FAILURES=$((FAILURES + 1))
else
    pass 'a missing media directory fails closed'
fi

if bash "$TARGET" --media-dir "$MEDIA_DIR" --groups "$GROUPS_MAP" --nope >/dev/null 2>&1; then
    echo "FAIL an unknown argument fails closed"
    FAILURES=$((FAILURES + 1))
else
    pass 'an unknown argument fails closed'
fi

if [ "$FAILURES" -eq 0 ]; then
    echo "test-encode-web-media: all checks passed"

    exit 0
fi

echo "test-encode-web-media: $FAILURES check(s) failed" >&2

exit 1

#!/bin/bash
# Self-test for the scene-overlay convention: filesystem references, orphan detection, and the three seed-hook behaviours the convention promises.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
SCREENSHOTS_DIR="$WORKSPACE_DIR/fixtures/screenshots"
SCENES_DIR="$SCREENSHOTS_DIR/scenes"
SHARED_DIR="$SCENES_DIR/shared"
SEED_SCRIPT="$SCRIPT_DIR/seed-screenshot-scene.sh"
TEMP_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

fail() {
    echo "test-seed-screenshot-scene: $1" >&2

    exit 1
}

pass() {
    echo "PASS: $1"
}

assert_equals() {
    local description="$1"
    local expected="$2"
    local actual="$3"

    if [ "$expected" != "$actual" ]; then
        fail "$description: expected '$expected', got '$actual'"
    fi

    pass "$description"
}

if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "test-seed-screenshot-scene: sqlite3 was not found in PATH, skipping"

    exit 0
fi

bash -n "$SEED_SCRIPT"

MISSING_REFERENCE_COUNT=0

for SCENE_FILE in "$SCENES_DIR"/*.sql; do
    while IFS= read -r REFERENCED_NAME; do
        if [ ! -f "$SHARED_DIR/$REFERENCED_NAME" ]; then
            echo "test-seed-screenshot-scene: $SCENE_FILE references missing shared/$REFERENCED_NAME" >&2
            MISSING_REFERENCE_COUNT=$((MISSING_REFERENCE_COUNT + 1))
        fi
    done < <(sed -n 's/^\.read shared\///p' "$SCENE_FILE")
done

assert_equals 'every .read shared/<x>.sql reference resolves to a committed file' 0 "$MISSING_REFERENCE_COUNT"

STORE_DATABASE_PATH="$TEMP_DIR/01-home.db"

SCENE=01-home LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$STORE_DATABASE_PATH" >/dev/null

assert_equals \
    'store scene 01-home has no overlay and keeps the lock flags off' \
    '0|0|0' \
    "$(sqlite3 "$STORE_DATABASE_PATH" "SELECT is_pin_enabled || '|' || is_biometric_enabled || '|' || is_screenshot_protection_enabled FROM settings;")"

FALLBACK_DATABASE_PATH="$TEMP_DIR/pin-app-lock-2.db"

SCENE=pin-app-lock-2 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$FALLBACK_DATABASE_PATH" >/dev/null

assert_equals \
    'pin-app-lock-2 falls back to pin-app-lock.sql and turns the lock flags on' \
    '1|1|1' \
    "$(sqlite3 "$FALLBACK_DATABASE_PATH" "SELECT is_pin_enabled || '|' || is_biometric_enabled || '|' || is_screenshot_protection_enabled FROM settings;")"

CLIP_DATABASE_PATH="$TEMP_DIR/pin-app-lock-clip-1.db"

SCENE=pin-app-lock-clip-1 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$CLIP_DATABASE_PATH" >/dev/null

assert_equals \
    'pin-app-lock-clip-1 strips -clip-<n> to reach the same route overlay' \
    '1|1|1' \
    "$(sqlite3 "$CLIP_DATABASE_PATH" "SELECT is_pin_enabled || '|' || is_biometric_enabled || '|' || is_screenshot_protection_enabled FROM settings;")"

HERO_DATABASE_PATH="$TEMP_DIR/home-hero-1.db"

SCENE=home-hero-1 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$HERO_DATABASE_PATH" >/dev/null

assert_equals \
    'home-hero-1 composes 5 shared reads into one session with no foreign key violations' \
    '' \
    "$(sqlite3 "$HERO_DATABASE_PATH" 'PRAGMA foreign_key_check;')"

REFERENCED_SHARED_NAMES=$(sed -n 's/^\.read shared\///p' "$SCENES_DIR"/*.sql | sort -u)
ORPHAN_SHARED_COUNT=0

for SHARED_FILE in "$SHARED_DIR"/*.sql; do
    SHARED_NAME=$(basename "$SHARED_FILE")

    if ! printf '%s\n' "$REFERENCED_SHARED_NAMES" | grep -qx "$SHARED_NAME"; then
        echo "test-seed-screenshot-scene: shared/$SHARED_NAME is not referenced by any scene" >&2
        ORPHAN_SHARED_COUNT=$((ORPHAN_SHARED_COUNT + 1))
    fi
done

assert_equals 'every shared/*.sql file is referenced by at least one scene' 0 "$ORPHAN_SHARED_COUNT"

echo "test-seed-screenshot-scene: ok"

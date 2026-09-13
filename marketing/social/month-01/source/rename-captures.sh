#!/usr/bin/env bash
# Copies raw social-capture screenshots into semantic filenames for one appearance.
set -euo pipefail

RAW_ROOT="${1:?usage: rename-captures.sh <raw-root> <appearance>}"
APPEARANCE="${2:?usage: rename-captures.sh <raw-root> <appearance>}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SOURCE_DIR="$RAW_ROOT/raw/ios/iphone-17-pro/en/$APPEARANCE"
DEST_DIR="$SCRIPT_DIR/screens/$APPEARANCE"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "rename-captures: source directory not found: $SOURCE_DIR" >&2

    exit 1
fi

mkdir -p "$DEST_DIR"

SCENE_TO_SEMANTIC="
social-showcase-1:home
social-showcase-2:transactions
social-showcase-3:analytics
social-showcase-4:add-expense
social-showcase-5:budget
social-showcase-6:settings-security
social-showcase-7:settings-ai
social-showcase-8:backup
social-showcase-9:import
social-showcase-10:bank-sync
social-showcase-11:crypto
social-showcase-12:debt
social-showcase-13:deposit
social-showcase-14:accounts
social-showcase-15:voice-entry
social-showcase-16:ai-suggestion
social-showcase-17:currency
social-showcase-18:categories
social-showcase-19:rules
social-lock-1:lock
social-lock-2:settings-security-locked
"

for PAIR in $SCENE_TO_SEMANTIC; do
    SCENE_NAME="${PAIR%%:*}"
    SEMANTIC_NAME="${PAIR##*:}"
    SOURCE_PATH="$SOURCE_DIR/$SCENE_NAME.png"
    DEST_PATH="$DEST_DIR/$SEMANTIC_NAME.png"

    if [ ! -f "$SOURCE_PATH" ]; then
        echo "rename-captures: missing $SOURCE_PATH, skipping" >&2

        continue
    fi

    cp "$SOURCE_PATH" "$DEST_PATH"
    echo "rename-captures: $SCENE_NAME.png -> $APPEARANCE/$SEMANTIC_NAME.png"
done

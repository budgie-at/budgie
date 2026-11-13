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

if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "test-seed-screenshot-scene: sqlite3 was not found in PATH, skipping database checks"

    exit 0
fi

STORE_DATABASE_PATH="$TEMP_DIR/01-home.db"

SCENE=01-home LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$STORE_DATABASE_PATH" >/dev/null

assert_equals \
    'store scene 01-home has no overlay and keeps the lock flags off' \
    '0|0|0' \
    "$(sqlite3 "$STORE_DATABASE_PATH" "SELECT is_pin_enabled || '|' || is_biometric_enabled || '|' || is_screenshot_protection_enabled FROM settings;")"

FALLBACK_DATABASE_PATH="$TEMP_DIR/pin-app-lock-2.db"

for LOCALE in en fr uk de es; do
    PRIVACY_DATABASE_PATH="$TEMP_DIR/07-settings-$LOCALE.db"

    SCENE=07-settings LOCALE="$LOCALE" APPEARANCE=dark \
        bash "$SEED_SCRIPT" --dry-run --output "$PRIVACY_DATABASE_PATH" >/dev/null

    assert_equals \
        "07-settings $LOCALE prepares screenshot protection and a recent backup before real PIN setup" \
        '0|0|1|1' \
        "$(sqlite3 "$PRIVACY_DATABASE_PATH" "SELECT is_pin_enabled || '|' || is_biometric_enabled || '|' || is_screenshot_protection_enabled || '|' || (date(last_backup_at, 'unixepoch') = date('now')) FROM settings;")"
done

ANDROID_DATABASE_PATH="$TEMP_DIR/07-settings-android.db"

PLATFORM=android SCENE=07-settings LOCALE=en APPEARANCE=dark \
    bash "$SEED_SCRIPT" --dry-run --output "$ANDROID_DATABASE_PATH" >/dev/null

assert_equals \
    'an Android capture database keeps screenshot protection off, since FLAG_SECURE would blank every capture' \
    '0' \
    "$(sqlite3 "$ANDROID_DATABASE_PATH" "SELECT is_screenshot_protection_enabled FROM settings;")"

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
    'home-hero-1 composes the 01-home shared reads into one session with no foreign key violations' \
    '' \
    "$(sqlite3 "$HERO_DATABASE_PATH" 'PRAGMA foreign_key_check;')"

assert_equals \
    'every seeded cell leaves asset account balances equal to the ledger' \
    '0' \
    "$(sqlite3 "$HERO_DATABASE_PATH" "SELECT COUNT(*) FROM account_balances INNER JOIN accounts ON accounts.id = account_balances.account_id WHERE accounts.type IN ('BANK', 'CASH', 'SAVINGS', 'DEPOSIT', 'CRYPTO') AND account_balances.amount != COALESCE((SELECT SUM(CASE WHEN transaction_entries.type = 'DEBIT' THEN transaction_entries.amount WHEN transaction_entries.type IN ('CREDIT', 'FEE') THEN -transaction_entries.amount ELSE 0 END) FROM transaction_entries INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id WHERE transaction_entries.account_id = account_balances.account_id AND transaction_entries.deleted_at IS NULL AND transactions.deleted_at IS NULL AND transactions.consolidation_parent_transaction_id IS NULL AND (transaction_entries.original_transaction_id IS NULL OR transactions.consolidation_type = 'REFUND')), 0);")"

BUDGET_DATABASE_PATH="$TEMP_DIR/budget-planning-2.db"

SCENE=budget-planning-2 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$BUDGET_DATABASE_PATH" >/dev/null

assert_equals \
    'budget-planning-2 seeds the budget-near-limit expenses' \
    '3' \
    "$(sqlite3 "$BUDGET_DATABASE_PATH" 'SELECT COUNT(*) FROM transactions WHERE id BETWEEN 1000 AND 1099;')"

UNCATEGORIZED_DATABASE_PATH="$TEMP_DIR/uncategorized-transactions-1.db"

SCENE=uncategorized-transactions-1 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$UNCATEGORIZED_DATABASE_PATH" >/dev/null

assert_equals \
    'uncategorized-transactions-1 clears the category on 14 recent expense entries' \
    '14' \
    "$(sqlite3 "$UNCATEGORIZED_DATABASE_PATH" "SELECT COUNT(*) FROM transaction_entries INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id WHERE transactions.type = 'EXPENSE' AND transaction_entries.category_id IS NULL;")"

TAGS_DATABASE_PATH="$TEMP_DIR/transaction-tags-1.db"

SCENE=transaction-tags-1 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$TAGS_DATABASE_PATH" >/dev/null

assert_equals \
    'transaction-tags-1 grows the base 5 tags with the tags-rich overlay' \
    '1' \
    "$(sqlite3 "$TAGS_DATABASE_PATH" 'SELECT (SELECT COUNT(*) FROM tags) > 5;')"

MONOBANK_DATABASE_PATH="$TEMP_DIR/monobank-sync-1.db"

SCENE=monobank-sync-1 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$MONOBANK_DATABASE_PATH" >/dev/null

assert_equals \
    'monobank-sync-1 connects a Monobank bank integration' \
    '1' \
    "$(sqlite3 "$MONOBANK_DATABASE_PATH" "SELECT COUNT(*) FROM bank_integrations WHERE provider = 'MONOBANK';")"

IDEMPOTENCE_DATABASE_PATH="$TEMP_DIR/tags-rich-idempotence.db"

cp "$TAGS_DATABASE_PATH" "$IDEMPOTENCE_DATABASE_PATH"
sqlite3 "$IDEMPOTENCE_DATABASE_PATH" < "$SHARED_DIR/tags-rich.sql"

assert_equals \
    'applying shared/tags-rich.sql a second time is a no-op' \
    "$(sqlite3 "$TAGS_DATABASE_PATH" "SELECT (SELECT COUNT(*) FROM tags) || '|' || (SELECT COUNT(*) FROM transactions);")" \
    "$(sqlite3 "$IDEMPOTENCE_DATABASE_PATH" "SELECT (SELECT COUNT(*) FROM tags) || '|' || (SELECT COUNT(*) FROM transactions);")"

REFERENCED_SHARED_NAMES=$(sed -n 's/^\.read shared\///p' "$SCENES_DIR"/*.sql | sort -u)
ORPHAN_SHARED_COUNT=0

for SHARED_FILE in "$SHARED_DIR"/*.sql; do
    SHARED_NAME=$(basename "$SHARED_FILE")

    if ! grep -qx "$SHARED_NAME" <<<"$REFERENCED_SHARED_NAMES"; then
        echo "test-seed-screenshot-scene: shared/$SHARED_NAME is not referenced by any scene" >&2
        ORPHAN_SHARED_COUNT=$((ORPHAN_SHARED_COUNT + 1))
    fi
done

assert_equals 'every shared/*.sql file is referenced by at least one scene' 0 "$ORPHAN_SHARED_COUNT"

echo "test-seed-screenshot-scene: ok"

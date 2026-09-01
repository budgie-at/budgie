#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
SCREENSHOTS_DIR="$WORKSPACE_DIR/fixtures/screenshots"
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

assert_equals() {
    local description="$1"
    local expected="$2"
    local actual="$3"

    if [ "$expected" != "$actual" ]; then
        fail "$description: expected '$expected', got '$actual'"
    fi
}

assert_positive() {
    local description="$1"
    local actual="$2"

    if [ "$actual" -le 0 ]; then
        fail "$description: expected a positive number, got '$actual'"
    fi
}

bash -n "$SEED_SCRIPT"
bash -n "$SCREENSHOTS_DIR/build-showcase.sh"

TODAY=$(date -u +%Y-%m-%d)

# Every locale that mobile-ci's capture manifest can ask for must resolve to a
# committed overlay and produce a self-consistent database offline.
for LOCALE_CODE in en fr uk de es; do
    for APPEARANCE_NAME in light dark; do
        case "$APPEARANCE_NAME" in
            light) EXPECTED_THEME=LIGHT ;;
            dark) EXPECTED_THEME=DARK ;;
        esac

        SEEDED_DATABASE_PATH="$TEMP_DIR/$LOCALE_CODE-$APPEARANCE_NAME.db"

        SCENE=home \
            LOCALE="$LOCALE_CODE" \
            APPEARANCE="$APPEARANCE_NAME" \
            DEVICE_SLUG=iphone-17-pro-max \
            PLATFORM=ios \
            bash "$SEED_SCRIPT" --dry-run --output "$SEEDED_DATABASE_PATH" > "$TEMP_DIR/$LOCALE_CODE-$APPEARANCE_NAME.log"

        test -f "$SEEDED_DATABASE_PATH"

        assert_equals "integrity check ($LOCALE_CODE/$APPEARANCE_NAME)" ok "$(sqlite3 "$SEEDED_DATABASE_PATH" 'PRAGMA integrity_check;')"
        assert_equals "foreign key check ($LOCALE_CODE/$APPEARANCE_NAME)" '' "$(sqlite3 "$SEEDED_DATABASE_PATH" 'PRAGMA foreign_key_check;')"

        assert_equals "settings rows ($LOCALE_CODE/$APPEARANCE_NAME)" 1 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM settings;')"
        assert_equals \
            "settings language/theme/locks ($LOCALE_CODE/$APPEARANCE_NAME)" \
            "$LOCALE_CODE|$EXPECTED_THEME|0|0|0" \
            "$(sqlite3 "$SEEDED_DATABASE_PATH" "SELECT language || '|' || theme || '|' || is_pin_enabled || '|' || is_biometric_enabled || '|' || is_screenshot_protection_enabled FROM settings;")"

        assert_equals "accounts ($LOCALE_CODE/$APPEARANCE_NAME)" 4 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM accounts;')"
        assert_equals "transactions ($LOCALE_CODE/$APPEARANCE_NAME)" 81 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM transactions;')"
        assert_equals "transaction entries ($LOCALE_CODE/$APPEARANCE_NAME)" 84 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM transaction_entries;')"
        assert_equals "tags ($LOCALE_CODE/$APPEARANCE_NAME)" 5 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM tags;')"
        assert_equals "budgets ($LOCALE_CODE/$APPEARANCE_NAME)" 2 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM budgets;')"
        assert_equals "budget category limits ($LOCALE_CODE/$APPEARANCE_NAME)" 8 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM budget_category_limits;')"
        assert_equals "account balances ($LOCALE_CODE/$APPEARANCE_NAME)" 4 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM account_balances;')"

        # budgie://account/1/details is a capture scene, so account 1 must exist
        # and carry the bulk of the ledger.
        assert_equals "main account ($LOCALE_CODE/$APPEARANCE_NAME)" 1 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM accounts WHERE id = 1 AND deleted_at IS NULL;')"
        assert_positive "main account entries ($LOCALE_CODE/$APPEARANCE_NAME)" "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM transaction_entries WHERE account_id = 1;')"

        assert_equals "newest transaction date ($LOCALE_CODE/$APPEARANCE_NAME)" "$TODAY" "$(sqlite3 "$SEEDED_DATABASE_PATH" "SELECT date(MAX(operated_at), 'unixepoch') FROM transactions;")"
        assert_equals "oldest transaction date ($LOCALE_CODE/$APPEARANCE_NAME)" "$(date -u -d '44 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-44d +%Y-%m-%d)" "$(sqlite3 "$SEEDED_DATABASE_PATH" "SELECT date(MIN(operated_at), 'unixepoch') FROM transactions;")"
        assert_equals "transactions after today ($LOCALE_CODE/$APPEARANCE_NAME)" 0 "$(sqlite3 "$SEEDED_DATABASE_PATH" "SELECT COUNT(*) FROM transactions WHERE date(operated_at, 'unixepoch') > date('now');")"

        # A monthly budget must always be part-way through its period, never
        # reset to zero by a capture that happens early in the month.
        assert_positive "budget spend in period ($LOCALE_CODE/$APPEARANCE_NAME)" "$(sqlite3 "$SEEDED_DATABASE_PATH" "
            SELECT COUNT(*)
            FROM transactions
            INNER JOIN transaction_entries ON transaction_entries.transaction_id = transactions.id
            WHERE transactions.type = 'EXPENSE'
              AND transaction_entries.type = 'CREDIT'
              AND transactions.operated_at >= unixepoch(date('now', '-23 days'));
        ")"
        assert_equals "budget period start day is a valid day of month ($LOCALE_CODE/$APPEARANCE_NAME)" 0 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM budgets WHERE period_start_day < 1 OR period_start_day > 28;')"

        # Every account, budget and entry must be denominated in one currency,
        # otherwise the app renders converted amounts nobody curated.
        assert_equals "single account currency ($LOCALE_CODE/$APPEARANCE_NAME)" 1 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(DISTINCT instrument_id) FROM accounts;')"
        assert_equals "budget currency matches accounts ($LOCALE_CODE/$APPEARANCE_NAME)" 0 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM budgets WHERE instrument_id != (SELECT instrument_id FROM accounts WHERE id = 1);')"
        assert_equals "default instrument matches accounts ($LOCALE_CODE/$APPEARANCE_NAME)" 0 "$(sqlite3 "$SEEDED_DATABASE_PATH" 'SELECT COUNT(*) FROM settings WHERE default_instrument_id != (SELECT instrument_id FROM accounts WHERE id = 1);')"
        assert_equals "budget allocation is not over-allocated ($LOCALE_CODE/$APPEARANCE_NAME)" 0 "$(sqlite3 "$SEEDED_DATABASE_PATH" '
            SELECT COUNT(*)
            FROM budgets
            WHERE overall_limit < other_limit + (SELECT COALESCE(SUM(limit_amount), 0) FROM budget_category_limits WHERE budget_id = budgets.id);
        ')"
    done
done

assert_equals 'en uses USD' 1 "$(sqlite3 "$TEMP_DIR/en-light.db" 'SELECT DISTINCT instrument_id FROM accounts;')"
assert_equals 'fr uses EUR' 2 "$(sqlite3 "$TEMP_DIR/fr-light.db" 'SELECT DISTINCT instrument_id FROM accounts;')"
assert_equals 'de uses EUR' 2 "$(sqlite3 "$TEMP_DIR/de-light.db" 'SELECT DISTINCT instrument_id FROM accounts;')"
assert_equals 'es uses EUR' 2 "$(sqlite3 "$TEMP_DIR/es-light.db" 'SELECT DISTINCT instrument_id FROM accounts;')"
assert_equals 'uk uses UAH' 33 "$(sqlite3 "$TEMP_DIR/uk-light.db" 'SELECT DISTINCT instrument_id FROM accounts;')"

# Overlays must actually rewrite the English source strings.
assert_equals 'de localises merchants' 0 "$(sqlite3 "$TEMP_DIR/de-light.db" "SELECT COUNT(*) FROM transactions WHERE title IN ('Whole Foods Market', 'Rent', 'Acme Corp Payroll');")"
assert_positive 'de keeps a German merchant' "$(sqlite3 "$TEMP_DIR/de-light.db" "SELECT COUNT(*) FROM transactions WHERE title = 'REWE';")"
assert_positive 'fr keeps a French merchant' "$(sqlite3 "$TEMP_DIR/fr-light.db" "SELECT COUNT(*) FROM transactions WHERE title = 'Carrefour Market';")"
assert_positive 'es keeps a Spanish merchant' "$(sqlite3 "$TEMP_DIR/es-light.db" "SELECT COUNT(*) FROM transactions WHERE title = 'Mercadona';")"
assert_positive 'uk keeps a Ukrainian merchant' "$(sqlite3 "$TEMP_DIR/uk-light.db" "SELECT COUNT(*) FROM transactions WHERE title = 'Сільпо';")"
assert_positive 'uk localises accounts' "$(sqlite3 "$TEMP_DIR/uk-light.db" "SELECT COUNT(*) FROM accounts WHERE title = 'Основний рахунок';")"
assert_positive 'uk scales amounts into hryvnia magnitudes' "$(sqlite3 "$TEMP_DIR/uk-light.db" 'SELECT COUNT(*) FROM transaction_entries WHERE amount > 20000000000;')"

# The committed fixture ages every day, so the shift must recover a stale
# dataset, not only one that happens to be current.
STALE_DATABASE_PATH="$TEMP_DIR/stale.db"
cp "$TEMP_DIR/en-light.db" "$STALE_DATABASE_PATH"
sqlite3 "$STALE_DATABASE_PATH" 'UPDATE transactions SET operated_at = operated_at - 137 * 86400, created_at = created_at - 137 * 86400;'
sqlite3 "$STALE_DATABASE_PATH" 'UPDATE transaction_entries SET created_at = created_at - 137 * 86400;'
sqlite3 "$STALE_DATABASE_PATH" < "$SCREENSHOTS_DIR/shift-dates.sql"
assert_equals 'shift recovers a stale fixture' "$TODAY" "$(sqlite3 "$STALE_DATABASE_PATH" "SELECT date(MAX(operated_at), 'unixepoch') FROM transactions;")"
sqlite3 "$STALE_DATABASE_PATH" < "$SCREENSHOTS_DIR/shift-dates.sql"
assert_equals 'shift is idempotent' "$TODAY" "$(sqlite3 "$STALE_DATABASE_PATH" "SELECT date(MAX(operated_at), 'unixepoch') FROM transactions;")"

# Fail closed on anything the capture matrix should never send.
if SCENE=home LOCALE=pt APPEARANCE=light bash "$SEED_SCRIPT" --dry-run --output "$TEMP_DIR/pt.db" >/dev/null 2>&1; then
    fail 'unsupported LOCALE was accepted'
fi

if SCENE=home LOCALE=en APPEARANCE=sepia bash "$SEED_SCRIPT" --dry-run --output "$TEMP_DIR/sepia.db" >/dev/null 2>&1; then
    fail 'unsupported APPEARANCE was accepted'
fi

if SCENE=home LOCALE=en APPEARANCE=light bash "$SEED_SCRIPT" --dry-run >/dev/null 2>&1; then
    fail '--dry-run without --output was accepted'
fi

if SCENE=home APPEARANCE=light bash "$SEED_SCRIPT" --dry-run --output "$TEMP_DIR/no-locale.db" >/dev/null 2>&1; then
    fail 'missing LOCALE was accepted'
fi

# The committed showcase database must stay at the current Drizzle journal head
# so the app never runs a data-repair migration over the curated dataset.
JOURNAL_MIGRATION_COUNT=$(node -e '
    const journal = require(process.argv[1]);

    process.stdout.write(String(journal.entries.length));
' "$WORKSPACE_DIR/../../packages/app/drizzle/meta/_journal.json")
assert_equals 'showcase.db is at the current migration head' "$JOURNAL_MIGRATION_COUNT" "$(sqlite3 "$SCREENSHOTS_DIR/showcase.db" 'SELECT COUNT(*) FROM __drizzle_migrations;')"

echo "test-seed-screenshot-scene: ok"

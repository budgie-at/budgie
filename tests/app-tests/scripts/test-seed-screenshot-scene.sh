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

# ---------------------------------------------------------------------------
# Scene overlay contract
# ---------------------------------------------------------------------------

SCENES_DIR="$SCREENSHOTS_DIR/scenes"
SCENE_OVERLAYS_MAP_PATH="$SCENES_DIR/scene-overlays.json"

# Tables an overlay is allowed to grow. Everything else must stay untouched, so
# a typo in one overlay cannot quietly reshape the base dataset.
COUNTED_TABLES="accounts account_balances bank_integrations bank_syncs budgets budget_category_limits categories debt_events exchange_rates instrument_daily_market_prices rule_actions rule_conditions rules settings tags transactions transaction_entries transaction_tags"

# The store scenes are the 8 cells .github/store-screenshots.config.json
# captures. Their seeded database must not move by a single byte.
STORE_SCENE_NAMES="00-prime 01-home 02-transactions 03-analytics 04-budget 05-add-expense 06-account 07-settings"

test -f "$SCENE_OVERLAYS_MAP_PATH"

list_overlay_files() {
    node -e '
        const fs = require("fs");

        process.stdout.write(
            fs
                .readdirSync(process.argv[1])
                .filter(name => name.endsWith(".sql"))
                .map(name => name.slice(0, -4))
                .sort()
                .join("\n")
        );
    ' "$SCENES_DIR"
}

list_scene_names() {
    node -e '
        const fs = require("fs");

        process.stdout.write(Object.keys(JSON.parse(fs.readFileSync(process.argv[1], "utf8"))).sort().join("\n"));
    ' "$SCENE_OVERLAYS_MAP_PATH"
}

list_declared_overlays() {
    node -e '
        const fs = require("fs");
        const map = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));

        process.stdout.write([...new Set(Object.values(map).flat())].sort().join("\n"));
    ' "$SCENE_OVERLAYS_MAP_PATH"
}

# `settings.updated_at` and the exchange-rate freshness stamps are written from
# `now`, so two runs a second apart differ on them and nothing else. Zeroing
# them is what makes the byte-identity comparison below meaningful.
normalize_database() {
    sqlite3 "$1" 'UPDATE settings SET updated_at = 0; UPDATE exchange_rates SET created_at = 0, updated_at = 0;'
}

dump_database() {
    normalize_database "$1"
    sqlite3 "$1" '.dump'
}

count_signature() {
    local database_path="$1"
    local table_name

    for table_name in $COUNTED_TABLES; do
        echo "$table_name=$(sqlite3 "$database_path" "SELECT COUNT(*) FROM $table_name;")"
    done
}

table_count() {
    sqlite3 "$1" "SELECT COUNT(*) FROM $2;"
}

# The tables each overlay claims to grow. Asserted to actually grow, so an
# overlay that silently stops inserting is a test failure, not a blank screen
# discovered during a 7-hour capture run.
overlay_grown_tables() {
    case "$1" in
        archived) echo 'accounts account_balances transactions transaction_entries' ;;
        bank-fees) echo 'transactions transaction_entries' ;;
        bank-sync-connected) echo 'accounts account_balances bank_integrations bank_syncs transactions transaction_entries' ;;
        budget-near-limit) echo 'transactions transaction_entries' ;;
        crypto) echo 'accounts account_balances instrument_daily_market_prices transactions transaction_entries' ;;
        cyrillic-taxonomy) echo 'categories tags' ;;
        debt) echo 'accounts account_balances debt_events transactions transaction_entries' ;;
        deposit) echo 'accounts account_balances transactions transaction_entries' ;;
        import-presets) echo 'accounts account_balances bank_integrations transactions transaction_entries' ;;
        long-history) echo 'transactions transaction_entries' ;;
        multi-currency) echo 'accounts account_balances transactions transaction_entries' ;;
        net-worth-full) echo '' ;;
        recurring) echo 'transactions transaction_entries' ;;
        refund) echo 'transactions transaction_entries' ;;
        rules) echo 'rule_actions rule_conditions rules' ;;
        security-locked) echo '' ;;
        split-transaction) echo 'transactions transaction_entries' ;;
        tags-rich) echo 'tags transactions transaction_entries transaction_tags' ;;
        transfer-pair) echo 'transactions transaction_entries' ;;
        uncategorized) echo 'transactions transaction_entries' ;;
        *) fail "overlay '$1' has no declared table list in overlay_grown_tables" ;;
    esac
}

OVERLAY_FILE_NAMES=$(list_overlay_files)
SCENE_NAMES=$(list_scene_names)
DECLARED_OVERLAY_NAMES=$(list_declared_overlays)

# The map and the overlay files must describe the same set: a scene pointing at
# a missing file fails the capture, an unclaimed overlay file is dead weight.
assert_equals 'every declared overlay has a committed .sql file, and every file is claimed' "$OVERLAY_FILE_NAMES" "$DECLARED_OVERLAY_NAMES"

# ---------------------------------------------------------------------------
# The 7 store scenes must be byte-identical to the pre-overlay pipeline
# ---------------------------------------------------------------------------

# The seed pipeline exactly as it was before scene overlays existed. If the hook
# ever starts touching a store scene's database, this diverges.
build_legacy_database() {
    local locale_code="$1"
    local theme_name="$2"
    local database_path="$3"

    cp "$SCREENSHOTS_DIR/showcase.db" "$database_path"
    rm -f "$database_path-wal" "$database_path-shm"

    sqlite3 "$database_path" < "$SCREENSHOTS_DIR/$locale_code.sql"
    sqlite3 "$database_path" < "$SCREENSHOTS_DIR/shift-dates.sql"
    sqlite3 "$database_path" "
        UPDATE settings
        SET
            language = '$locale_code',
            theme = '$theme_name',
            is_screenshot_protection_enabled = 0,
            is_pin_enabled = 0,
            is_biometric_enabled = 0,
            is_budget_push_enabled = 0,
            updated_at = unixepoch('now');
    "
    sqlite3 "$database_path" 'PRAGMA wal_checkpoint(TRUNCATE);' >/dev/null
    rm -f "$database_path-wal" "$database_path-shm"
}

for LOCALE_CODE in en fr uk de es; do
    LEGACY_DATABASE_PATH="$TEMP_DIR/legacy-$LOCALE_CODE.db"

    build_legacy_database "$LOCALE_CODE" LIGHT "$LEGACY_DATABASE_PATH"
    dump_database "$LEGACY_DATABASE_PATH" > "$TEMP_DIR/legacy-$LOCALE_CODE.sql"

    for STORE_SCENE_NAME in $STORE_SCENE_NAMES; do
        STORE_DATABASE_PATH="$TEMP_DIR/store-$STORE_SCENE_NAME-$LOCALE_CODE.db"

        SCENE="$STORE_SCENE_NAME" \
            LOCALE="$LOCALE_CODE" \
            APPEARANCE=light \
            bash "$SEED_SCRIPT" --dry-run --output "$STORE_DATABASE_PATH" >/dev/null

        dump_database "$STORE_DATABASE_PATH" > "$TEMP_DIR/store-$STORE_SCENE_NAME-$LOCALE_CODE.sql"

        if ! diff -q "$TEMP_DIR/legacy-$LOCALE_CODE.sql" "$TEMP_DIR/store-$STORE_SCENE_NAME-$LOCALE_CODE.sql" >/dev/null; then
            fail "store scene $STORE_SCENE_NAME/$LOCALE_CODE diverged from the pre-overlay pipeline"
        fi

        assert_equals \
            "store scene $STORE_SCENE_NAME/$LOCALE_CODE keeps the lock flags off" \
            '0|0|0' \
            "$(sqlite3 "$STORE_DATABASE_PATH" "SELECT is_pin_enabled || '|' || is_biometric_enabled || '|' || is_screenshot_protection_enabled FROM settings;")"

        rm -f "$STORE_DATABASE_PATH" "$TEMP_DIR/store-$STORE_SCENE_NAME-$LOCALE_CODE.sql"
    done
done

# ---------------------------------------------------------------------------
# Every overlay, on its own, against every locale
# ---------------------------------------------------------------------------

# A sandbox copy of the fixtures lets the self-test point scenes at single
# overlays and at a deliberately missing one without polluting the committed
# map that the capture pipeline reads.
SANDBOX_DIR="$TEMP_DIR/sandbox"

mkdir -p "$SANDBOX_DIR/scripts" "$SANDBOX_DIR/fixtures"
cp -R "$SCREENSHOTS_DIR" "$SANDBOX_DIR/fixtures/screenshots"
cp "$SEED_SCRIPT" "$SANDBOX_DIR/scripts/seed-screenshot-scene.sh"

SANDBOX_SEED_SCRIPT="$SANDBOX_DIR/scripts/seed-screenshot-scene.sh"

node -e '
    const fs = require("fs");
    const [mapPath, sandboxMapPath] = process.argv.slice(1);
    const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));

    for (const overlayName of new Set(Object.values(map).flat())) {
        map[`selftest-${overlayName}`] = [overlayName];
    }

    map["selftest-missing-overlay"] = ["overlay-that-does-not-exist"];

    fs.writeFileSync(sandboxMapPath, JSON.stringify(map, null, 4));
' "$SCENE_OVERLAYS_MAP_PATH" "$SANDBOX_DIR/fixtures/screenshots/scenes/scene-overlays.json"

if SCENE=selftest-missing-overlay LOCALE=en APPEARANCE=light bash "$SANDBOX_SEED_SCRIPT" --dry-run --output "$TEMP_DIR/missing.db" >/dev/null 2>&1; then
    fail 'a scene declaring a missing overlay file was accepted'
fi

for LOCALE_CODE in en fr uk de es; do
    BASE_DATABASE_PATH="$TEMP_DIR/base-$LOCALE_CODE.db"

    env -u SCENE LOCALE="$LOCALE_CODE" APPEARANCE=light \
        bash "$SANDBOX_SEED_SCRIPT" --dry-run --output "$BASE_DATABASE_PATH" >/dev/null

    count_signature "$BASE_DATABASE_PATH" > "$TEMP_DIR/base-$LOCALE_CODE.counts"

    while IFS= read -r OVERLAY_NAME; do
        OVERLAY_DATABASE_PATH="$TEMP_DIR/overlay-$OVERLAY_NAME-$LOCALE_CODE.db"

        SCENE="selftest-$OVERLAY_NAME" \
            LOCALE="$LOCALE_CODE" \
            APPEARANCE=light \
            bash "$SANDBOX_SEED_SCRIPT" --dry-run --output "$OVERLAY_DATABASE_PATH" >/dev/null

        assert_equals "integrity check ($OVERLAY_NAME/$LOCALE_CODE)" ok "$(sqlite3 "$OVERLAY_DATABASE_PATH" 'PRAGMA integrity_check;')"
        assert_equals "foreign key check ($OVERLAY_NAME/$LOCALE_CODE)" '' "$(sqlite3 "$OVERLAY_DATABASE_PATH" 'PRAGMA foreign_key_check;')"
        assert_equals "settings rows ($OVERLAY_NAME/$LOCALE_CODE)" 1 "$(table_count "$OVERLAY_DATABASE_PATH" settings)"
        assert_equals \
            "settings language ($OVERLAY_NAME/$LOCALE_CODE)" \
            "$LOCALE_CODE" \
            "$(sqlite3 "$OVERLAY_DATABASE_PATH" 'SELECT language FROM settings;')"
        assert_equals \
            "transactions after today ($OVERLAY_NAME/$LOCALE_CODE)" \
            0 \
            "$(sqlite3 "$OVERLAY_DATABASE_PATH" "SELECT COUNT(*) FROM transactions WHERE date(operated_at, 'unixepoch') > date('now');")"
        assert_equals \
            "orphan entries ($OVERLAY_NAME/$LOCALE_CODE)" \
            0 \
            "$(sqlite3 "$OVERLAY_DATABASE_PATH" 'SELECT COUNT(*) FROM transaction_entries WHERE transaction_id NOT IN (SELECT id FROM transactions);')"
        assert_equals \
            "entryless transactions ($OVERLAY_NAME/$LOCALE_CODE)" \
            0 \
            "$(sqlite3 "$OVERLAY_DATABASE_PATH" 'SELECT COUNT(*) FROM transactions WHERE id NOT IN (SELECT transaction_id FROM transaction_entries);')"

        GROWN_TABLE_NAMES=$(overlay_grown_tables "$OVERLAY_NAME")

        for GROWN_TABLE_NAME in $GROWN_TABLE_NAMES; do
            BASE_ROW_COUNT=$(grep "^$GROWN_TABLE_NAME=" "$TEMP_DIR/base-$LOCALE_CODE.counts" | cut -d= -f2)
            OVERLAY_ROW_COUNT=$(table_count "$OVERLAY_DATABASE_PATH" "$GROWN_TABLE_NAME")

            assert_positive \
                "$OVERLAY_NAME/$LOCALE_CODE grows $GROWN_TABLE_NAME" \
                "$((OVERLAY_ROW_COUNT - BASE_ROW_COUNT))"
        done

        # Re-running an overlay must be a no-op, matching shift-dates.sql's
        # guarantee, so a scene stack that lists an overlay twice is harmless.
        count_signature "$OVERLAY_DATABASE_PATH" > "$TEMP_DIR/overlay-$OVERLAY_NAME-$LOCALE_CODE.counts"
        sqlite3 "$OVERLAY_DATABASE_PATH" < "$SCENES_DIR/$OVERLAY_NAME.sql"
        count_signature "$OVERLAY_DATABASE_PATH" > "$TEMP_DIR/overlay-$OVERLAY_NAME-$LOCALE_CODE.repeat"

        if ! diff -q "$TEMP_DIR/overlay-$OVERLAY_NAME-$LOCALE_CODE.counts" "$TEMP_DIR/overlay-$OVERLAY_NAME-$LOCALE_CODE.repeat" >/dev/null; then
            fail "overlay $OVERLAY_NAME/$LOCALE_CODE is not idempotent"
        fi

        rm -f "$OVERLAY_DATABASE_PATH"
    done <<< "$OVERLAY_FILE_NAMES"
done

# `security-locked` is the reason the hook's lock flags became scene-conditional.
SECURITY_DATABASE_PATH="$TEMP_DIR/security-locked.db"

SCENE=pin-app-lock-1 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$SECURITY_DATABASE_PATH" >/dev/null

assert_equals \
    'security-locked turns the lock flags on' \
    '1|1|1' \
    "$(sqlite3 "$SECURITY_DATABASE_PATH" "SELECT is_pin_enabled || '|' || is_biometric_enabled || '|' || is_screenshot_protection_enabled FROM settings;")"

# `net-worth-full` only updates rows, so it is asserted on its effect rather
# than on a row-count delta: the home hero has to show every asset section.
NET_WORTH_DATABASE_PATH="$TEMP_DIR/net-worth-full.db"

SCENE=home-hero-1 LOCALE=en APPEARANCE=light \
    bash "$SEED_SCRIPT" --dry-run --output "$NET_WORTH_DATABASE_PATH" >/dev/null

assert_equals \
    'net-worth-full leaves no live account out of net worth' \
    0 \
    "$(sqlite3 "$NET_WORTH_DATABASE_PATH" 'SELECT COUNT(*) FROM accounts WHERE deleted_at IS NULL AND (include_in_net_worth = 0 OR is_active = 0);')"
assert_equals \
    'net-worth-full covers every home account section' \
    'BANK,CASH,CRYPTO,DEBT,DEPOSIT,SAVINGS' \
    "$(sqlite3 "$NET_WORTH_DATABASE_PATH" "SELECT GROUP_CONCAT(type) FROM (SELECT DISTINCT type FROM accounts WHERE deleted_at IS NULL ORDER BY type);")"
assert_equals \
    'net-worth-full keeps both debt directions' \
    2 \
    "$(sqlite3 "$NET_WORTH_DATABASE_PATH" "SELECT COUNT(DISTINCT debt_type) FROM accounts WHERE type = 'DEBT' AND deleted_at IS NULL;")"

# ---------------------------------------------------------------------------
# Every scene the committed map declares, against every locale
# ---------------------------------------------------------------------------

for LOCALE_CODE in en fr uk de es; do
    while IFS= read -r SCENE_NAME; do
        SCENE_DATABASE_PATH="$TEMP_DIR/scene.db"

        SCENE="$SCENE_NAME" \
            LOCALE="$LOCALE_CODE" \
            APPEARANCE=light \
            bash "$SEED_SCRIPT" --dry-run --output "$SCENE_DATABASE_PATH" >/dev/null

        assert_equals "integrity check (scene $SCENE_NAME/$LOCALE_CODE)" ok "$(sqlite3 "$SCENE_DATABASE_PATH" 'PRAGMA integrity_check;')"
        assert_equals "foreign key check (scene $SCENE_NAME/$LOCALE_CODE)" '' "$(sqlite3 "$SCENE_DATABASE_PATH" 'PRAGMA foreign_key_check;')"
        assert_equals "settings rows (scene $SCENE_NAME/$LOCALE_CODE)" 1 "$(table_count "$SCENE_DATABASE_PATH" settings)"
        assert_equals \
            "transactions after today (scene $SCENE_NAME/$LOCALE_CODE)" \
            0 \
            "$(sqlite3 "$SCENE_DATABASE_PATH" "SELECT COUNT(*) FROM transactions WHERE date(operated_at, 'unixepoch') > date('now');")"

        rm -f "$SCENE_DATABASE_PATH"
    done <<< "$SCENE_NAMES"
done

echo "test-seed-screenshot-scene: ok"

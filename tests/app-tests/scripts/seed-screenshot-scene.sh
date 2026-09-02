#!/usr/bin/env bash
# Store-screenshot seed hook for rnw-community/mobile-ci's store-screenshots
# `seed-command` (direct capture mode).
#
# Runs once per `locale x appearance x scene` cell, from the repo root, with
# the app installed and terminated. It builds the showcase database for that
# cell and installs it over the app's live database so the scene's deep link
# opens straight onto rich, locale-appropriate data.
#
# Environment (mobile-ci seed hook contract):
#   SCENE           scene name
#   LOCALE          en | fr | uk | de | es
#   APPEARANCE      light | dark
#   APP_ID          bundle id
#   PLATFORM        ios
#   DEVICE_SLUG     slugified device name
#   SIMULATOR_UDID  booted simulator UDID
#   APP_PATH        packaged .app path
#
# The database is assembled from fixtures/screenshots:
#   showcase.db            curated dataset, anchored on a fixed date
#   <LOCALE>.sql           locale overlay (strings + display currency)
#   shift-dates.sql        re-anchors every date on the capture day
#   scenes/<overlay>.sql   per-scene state overlays, applied last
# and the hook itself owns `language` and `theme`.
#
# Scene overlays are looked up by SCENE in the committed map
# fixtures/screenshots/scenes/scene-overlays.json, so mobile-ci's capture
# config keeps its own schema and carries no Budgie-specific keys:
#
#   { "<scene-id>": ["overlay-a", "overlay-b"] }
#
# A scene with no entry behaves exactly as before; a declared overlay whose
# file is missing is a hard failure. Overlays run AFTER shift-dates.sql and
# after the hook's own settings write, so they see the shifted ledger and may
# override the lock flags (see fixtures/screenshots/README.md).
#
# Offline mode, used by test-seed-screenshot-scene.sh and for local inspection:
#   LOCALE=de APPEARANCE=dark scripts/seed-screenshot-scene.sh --dry-run --output /tmp/de.db

set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SCREENSHOTS_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../fixtures/screenshots" && pwd)
SHOWCASE_DATABASE_PATH="$SCREENSHOTS_DIR/showcase.db"
SHIFT_DATES_SQL_PATH="$SCREENSHOTS_DIR/shift-dates.sql"
SCENES_DIR="$SCREENSHOTS_DIR/scenes"
SCENE_OVERLAYS_MAP_PATH="$SCENES_DIR/scene-overlays.json"
SCENE_OVERLAY_NAMES=""

IS_DRY_RUN=false
OUTPUT_DATABASE_PATH=""

while [ "$#" -gt 0 ]; do
    case "$1" in
        --dry-run)
            IS_DRY_RUN=true
            shift
            ;;
        --output)
            if [ "$#" -lt 2 ]; then
                echo "seed-screenshot-scene: --output requires a path" >&2

                exit 1
            fi

            OUTPUT_DATABASE_PATH="$2"
            shift 2
            ;;
        *)
            echo "seed-screenshot-scene: unknown argument: $1" >&2

            exit 1
            ;;
    esac
done

if [ "$IS_DRY_RUN" = true ] && [ -z "$OUTPUT_DATABASE_PATH" ]; then
    echo "seed-screenshot-scene: --dry-run requires --output <path>" >&2

    exit 1
fi

if [ "$IS_DRY_RUN" = false ] && [ -n "$OUTPUT_DATABASE_PATH" ]; then
    echo "seed-screenshot-scene: --output is only supported together with --dry-run" >&2

    exit 1
fi

LOCALE="${LOCALE:?LOCALE is required}"
APPEARANCE="${APPEARANCE:?APPEARANCE is required}"

case "$LOCALE" in
    en | fr | uk | de | es) ;;
    *)
        echo "seed-screenshot-scene: unsupported LOCALE '$LOCALE', expected one of: en fr uk de es" >&2

        exit 1
        ;;
esac

case "$APPEARANCE" in
    light)
        THEME=LIGHT
        ;;
    dark)
        THEME=DARK
        ;;
    *)
        echo "seed-screenshot-scene: unsupported APPEARANCE '$APPEARANCE', expected one of: light dark" >&2

        exit 1
        ;;
esac

if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "seed-screenshot-scene: sqlite3 was not found in PATH" >&2

    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "seed-screenshot-scene: node was not found in PATH" >&2

    exit 1
fi

for REQUIRED_FIXTURE_PATH in "$SHOWCASE_DATABASE_PATH" "$SHIFT_DATES_SQL_PATH" "$SCREENSHOTS_DIR/$LOCALE.sql"; do
    if [ ! -f "$REQUIRED_FIXTURE_PATH" ]; then
        echo "seed-screenshot-scene: required fixture is missing: $REQUIRED_FIXTURE_PATH" >&2

        exit 1
    fi
done

WORK_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$WORK_DIR"
}

trap cleanup EXIT

PREPARED_DATABASE_PATH="$WORK_DIR/budgie.db"

# Prints the overlay names the current SCENE declares, one per line, or nothing
# when the scene has no entry. Keeping the map in its own committed file means
# mobile-ci's capture config never grows a Budgie-specific key.
resolve_scene_overlays() {
    if [ -z "${SCENE:-}" ] || [ ! -f "$SCENE_OVERLAYS_MAP_PATH" ]; then
        return 0
    fi

    node -e '
        const fs = require("fs");
        const [mapPath, sceneName] = process.argv.slice(1);
        const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));

        if (!Object.prototype.hasOwnProperty.call(map, sceneName)) {
            process.exit(0);
        }

        const overlayNames = map[sceneName];
        const isOverlayName = value => typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/.test(value);

        if (!Array.isArray(overlayNames) || overlayNames.length === 0 || !overlayNames.every(isOverlayName)) {
            process.stderr.write(`scene "${sceneName}" must map to a non-empty array of overlay names\n`);
            process.exit(1);
        }

        process.stdout.write(overlayNames.join("\n") + "\n");
    ' "$SCENE_OVERLAYS_MAP_PATH" "$SCENE"
}

# Applies the SCENE's overlays in declaration order. Overlays run last, on top
# of the shifted ledger and the hook's settings write, so they are authored
# relative to `now` and may deliberately re-enable the lock flags.
apply_scene_overlays() {
    local overlay_name
    local overlay_path

    if [ -z "$SCENE_OVERLAY_NAMES" ]; then
        return 0
    fi

    while IFS= read -r overlay_name; do
        overlay_path="$SCENES_DIR/$overlay_name.sql"

        if [ ! -f "$overlay_path" ]; then
            echo "seed-screenshot-scene: scene '${SCENE:-}' declares overlay '$overlay_name' but $overlay_path is missing" >&2

            exit 1
        fi

        sqlite3 "$PREPARED_DATABASE_PATH" < "$overlay_path"
    done <<< "$SCENE_OVERLAY_NAMES"
}

# Builds the seeded database for the current LOCALE/APPEARANCE/SCENE cell.
# Every step writes into a scratch copy, so the committed fixtures stay
# untouched and the hook is safe to re-run for every cell of the capture matrix.
prepare_database() {
    cp "$SHOWCASE_DATABASE_PATH" "$PREPARED_DATABASE_PATH"
    rm -f "$PREPARED_DATABASE_PATH-wal" "$PREPARED_DATABASE_PATH-shm"

    SCENE_OVERLAY_NAMES=$(resolve_scene_overlays)

    sqlite3 "$PREPARED_DATABASE_PATH" < "$SCREENSHOTS_DIR/$LOCALE.sql"
    sqlite3 "$PREPARED_DATABASE_PATH" < "$SHIFT_DATES_SQL_PATH"

    sqlite3 "$PREPARED_DATABASE_PATH" "
        UPDATE settings
        SET
            language = '$LOCALE',
            theme = '$THEME',
            is_screenshot_protection_enabled = 0,
            is_pin_enabled = 0,
            is_biometric_enabled = 0,
            is_budget_push_enabled = 0,
            updated_at = unixepoch('now');
    "

    apply_scene_overlays

    sqlite3 "$PREPARED_DATABASE_PATH" 'PRAGMA wal_checkpoint(TRUNCATE);' >/dev/null
    rm -f "$PREPARED_DATABASE_PATH-wal" "$PREPARED_DATABASE_PATH-shm"
}

assert_single_row() {
    local description="$1"
    local query="$2"
    local row_count

    row_count=$(sqlite3 "$PREPARED_DATABASE_PATH" "$query")

    if [ "$row_count" != "1" ]; then
        echo "seed-screenshot-scene: $description matched $row_count rows, expected exactly 1" >&2

        exit 1
    fi
}

verify_database() {
    local integrity_check
    local foreign_key_check
    local future_transaction_count
    local today_transaction_count

    integrity_check=$(sqlite3 "$PREPARED_DATABASE_PATH" 'PRAGMA integrity_check;')

    if [ "$integrity_check" != "ok" ]; then
        echo "seed-screenshot-scene: integrity check failed: $integrity_check" >&2

        exit 1
    fi

    foreign_key_check=$(sqlite3 "$PREPARED_DATABASE_PATH" 'PRAGMA foreign_key_check;')

    if [ -n "$foreign_key_check" ]; then
        echo "seed-screenshot-scene: foreign key check failed: $foreign_key_check" >&2

        exit 1
    fi

    assert_single_row 'settings table' 'SELECT COUNT(*) FROM settings;'
    assert_single_row \
        "settings row for locale=$LOCALE theme=$THEME" \
        "SELECT COUNT(*) FROM settings WHERE language = '$LOCALE' AND theme = '$THEME';"

    # The lock flags are the hook's default only while no scene overlay ran.
    # Scenes such as `security-locked` deliberately turn them on, and the
    # capture flow for those scenes has to unlock the app itself.
    if [ -z "$SCENE_OVERLAY_NAMES" ]; then
        assert_single_row \
            'settings row with the lock flags off' \
            'SELECT COUNT(*) FROM settings WHERE is_screenshot_protection_enabled = 0 AND is_pin_enabled = 0 AND is_biometric_enabled = 0;'
    fi

    assert_single_row 'main account (deep link budgie://account/1/details)' 'SELECT COUNT(*) FROM accounts WHERE id = 1 AND deleted_at IS NULL;'

    today_transaction_count=$(sqlite3 "$PREPARED_DATABASE_PATH" "SELECT COUNT(*) FROM transactions WHERE date(operated_at, 'unixepoch') = date('now');")

    if [ "$today_transaction_count" = "0" ]; then
        echo "seed-screenshot-scene: date shift left no transaction on the capture day" >&2

        exit 1
    fi

    future_transaction_count=$(sqlite3 "$PREPARED_DATABASE_PATH" "SELECT COUNT(*) FROM transactions WHERE date(operated_at, 'unixepoch') > date('now');")

    if [ "$future_transaction_count" != "0" ]; then
        echo "seed-screenshot-scene: date shift left $future_transaction_count transactions after the capture day" >&2

        exit 1
    fi
}

report_database() {
    echo "seed-screenshot-scene: scene=${SCENE:-} locale=$LOCALE appearance=$APPEARANCE theme=$THEME overlays=$(echo "$SCENE_OVERLAY_NAMES" | tr '\n' ',' | sed 's/,$//')"
    sqlite3 "$PREPARED_DATABASE_PATH" "
        SELECT 'accounts=' || (SELECT COUNT(*) FROM accounts)
            || ' transactions=' || (SELECT COUNT(*) FROM transactions)
            || ' entries=' || (SELECT COUNT(*) FROM transaction_entries)
            || ' tags=' || (SELECT COUNT(*) FROM tags)
            || ' budgets=' || (SELECT COUNT(*) FROM budgets)
            || ' oldest=' || (SELECT date(MIN(operated_at), 'unixepoch') FROM transactions)
            || ' newest=' || (SELECT date(MAX(operated_at), 'unixepoch') FROM transactions);
    "
}

install_database() {
    local app_data_container
    local sqlite_directory

    PLATFORM="${PLATFORM:-ios}"

    if [ "$PLATFORM" != "ios" ]; then
        echo "seed-screenshot-scene: unsupported PLATFORM '$PLATFORM', only ios is implemented" >&2

        exit 1
    fi

    APP_ID="${APP_ID:?APP_ID is required}"
    SIMULATOR_UDID="${SIMULATOR_UDID:?SIMULATOR_UDID is required}"

    app_data_container=$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data)

    if [ ! -d "$app_data_container" ]; then
        echo "seed-screenshot-scene: app data container for $APP_ID on $SIMULATOR_UDID is not a directory: $app_data_container" >&2

        exit 1
    fi

    sqlite_directory="$app_data_container/Documents/SQLite"

    xcrun simctl terminate "$SIMULATOR_UDID" "$APP_ID" >/dev/null 2>&1 || true
    mkdir -p "$sqlite_directory"
    rm -f "$sqlite_directory"/budgie.db*
    cp "$PREPARED_DATABASE_PATH" "$sqlite_directory/budgie.db"

    echo "seed-screenshot-scene: installed into $sqlite_directory/budgie.db"
}

prepare_database
verify_database
report_database

if [ "$IS_DRY_RUN" = true ]; then
    rm -f "$OUTPUT_DATABASE_PATH" "$OUTPUT_DATABASE_PATH-wal" "$OUTPUT_DATABASE_PATH-shm"
    cp "$PREPARED_DATABASE_PATH" "$OUTPUT_DATABASE_PATH"

    echo "seed-screenshot-scene: wrote $OUTPUT_DATABASE_PATH"

    exit 0
fi

install_database

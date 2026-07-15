#!/bin/sh

set -eu

script_directory=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
bank_sync_tests_directory=$(dirname "$script_directory")
repository_directory=$(cd "$bank_sync_tests_directory/../.." && pwd)
migrations_directory="$repository_directory/packages/app/drizzle"
journal_path="$migrations_directory/meta/_journal.json"
fixture_directory="$bank_sync_tests_directory/fixtures/debt-migration"
base_fixture_path="$repository_directory/tests/app-tests/fixtures/14.db"
pre_fixture_path="$fixture_directory/pre-0033.db"
early_fixture_path="$fixture_directory/early-0033.db"
missing_event_fixture_path="$fixture_directory/missing-1007-debt-event.db"
app_fixture_path="$repository_directory/tests/app-tests/fixtures/35-debt-migration-repair.db"
deployed_early_0033_hash=2ec08a778d2739493248d66f135aba3c9a2ae8e45359e40b58176dbb643c0a60

apply_migration() {
    apply_migration_database_path=$1
    apply_migration_index=$2
    apply_migration_path=$(find "$migrations_directory" -maxdepth 1 -name "${apply_migration_index}_*.sql" -print)
    apply_migration_tag=$(basename "$apply_migration_path" .sql)
    apply_migration_timestamp=$(jq -r --arg tag "$apply_migration_tag" '.entries[] | select(.tag == $tag) | .when' "$journal_path")
    apply_migration_timestamp_seconds=$((apply_migration_timestamp / 1000))
    apply_migration_hash=$(shasum -a 256 "$apply_migration_path" | cut -d ' ' -f 1)
    sqlite3 "$apply_migration_database_path" < "$apply_migration_path"
    sqlite3 "$apply_migration_database_path" "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('$apply_migration_hash', $apply_migration_timestamp);"

    case "$apply_migration_index" in
        0024)
            sqlite3 "$apply_migration_database_path" "UPDATE default_category_translations SET created_at = $apply_migration_timestamp_seconds, updated_at = $apply_migration_timestamp_seconds;"
            ;;
        0026)
            sqlite3 "$apply_migration_database_path" "UPDATE historical_exchange_rates SET created_at = $apply_migration_timestamp_seconds, updated_at = $apply_migration_timestamp_seconds;"
            ;;
        0028)
            sqlite3 "$apply_migration_database_path" "UPDATE instruments SET created_at = $apply_migration_timestamp_seconds, updated_at = $apply_migration_timestamp_seconds WHERE type = 'CRYPTO';"
            ;;
        0030)
            sqlite3 "$apply_migration_database_path" "UPDATE instrument_daily_market_prices SET created_at = $apply_migration_timestamp_seconds, updated_at = $apply_migration_timestamp_seconds;"
            sqlite3 "$apply_migration_database_path" "UPDATE historical_exchange_rates SET created_at = $apply_migration_timestamp_seconds, updated_at = $apply_migration_timestamp_seconds;"
            ;;
    esac
}

finalize_fixture() {
    finalize_fixture_database_path=$1
    finalize_fixture_vacuum_path="$finalize_fixture_database_path-vacuum"
    rm -f \
        "$finalize_fixture_vacuum_path" \
        "$finalize_fixture_vacuum_path-journal" \
        "$finalize_fixture_vacuum_path-shm" \
        "$finalize_fixture_vacuum_path-wal"
    sqlite3 "$finalize_fixture_database_path" "VACUUM INTO '$finalize_fixture_vacuum_path';"
    sqlite3 "$finalize_fixture_vacuum_path" "PRAGMA journal_mode = WAL;" >/dev/null
    mv "$finalize_fixture_vacuum_path" "$finalize_fixture_database_path"
    rm -f \
        "$finalize_fixture_database_path-journal" \
        "$finalize_fixture_database_path-shm" \
        "$finalize_fixture_database_path-wal" \
        "$finalize_fixture_vacuum_path-journal" \
        "$finalize_fixture_vacuum_path-shm" \
        "$finalize_fixture_vacuum_path-wal"
}

rm -f \
    "$pre_fixture_path" \
    "$pre_fixture_path-journal" \
    "$pre_fixture_path-shm" \
    "$pre_fixture_path-wal" \
    "$early_fixture_path" \
    "$early_fixture_path-journal" \
    "$early_fixture_path-shm" \
    "$early_fixture_path-wal" \
    "$missing_event_fixture_path" \
    "$missing_event_fixture_path-journal" \
    "$missing_event_fixture_path-shm" \
    "$missing_event_fixture_path-wal" \
    "$app_fixture_path" \
    "$app_fixture_path-journal" \
    "$app_fixture_path-shm" \
    "$app_fixture_path-wal"
cp "$base_fixture_path" "$pre_fixture_path"

migration_index=15
while [ "$migration_index" -le 32 ]; do
    apply_migration "$pre_fixture_path" "$(printf '%04d' "$migration_index")"
    migration_index=$((migration_index + 1))
done

sqlite3 "$pre_fixture_path" < "$fixture_directory/legacy-borrowed-debt.sql"
sqlite3 "$pre_fixture_path" "VACUUM;"

cp "$pre_fixture_path" "$early_fixture_path"
apply_migration "$early_fixture_path" 0033
sqlite3 "$early_fixture_path" "UPDATE __drizzle_migrations SET hash = '$deployed_early_0033_hash' WHERE created_at = $apply_migration_timestamp;"
sqlite3 "$early_fixture_path" < "$fixture_directory/emulate-early-0033.sql"
apply_migration "$early_fixture_path" 0034
sqlite3 "$early_fixture_path" "VACUUM;"
cp "$early_fixture_path" "$app_fixture_path"
cp "$early_fixture_path" "$missing_event_fixture_path"
apply_migration "$missing_event_fixture_path" 0035
sqlite3 "$missing_event_fixture_path" "UPDATE transaction_entries SET deleted_at = $apply_migration_timestamp_seconds, updated_at = $apply_migration_timestamp_seconds WHERE kind = 'DEBT_SETTLEMENT' AND deleted_at IS NOT NULL;"
missing_event_count=$(sqlite3 "$missing_event_fixture_path" "SELECT COUNT(*) FROM debt_events WHERE transaction_id = 1007 AND deleted_at IS NULL;")
if [ "$missing_event_count" -ne 1 ]; then
    echo "Expected exactly one live debt event for transaction 1007, found $missing_event_count" >&2
    exit 1
fi
sqlite3 "$missing_event_fixture_path" "DELETE FROM debt_events WHERE transaction_id = 1007 AND deleted_at IS NULL;"
sqlite3 "$missing_event_fixture_path" "VACUUM;"
finalize_fixture "$pre_fixture_path"
finalize_fixture "$early_fixture_path"
finalize_fixture "$missing_event_fixture_path"
finalize_fixture "$app_fixture_path"
rm -f \
    "$pre_fixture_path-journal" \
    "$pre_fixture_path-shm" \
    "$pre_fixture_path-wal" \
    "$early_fixture_path-journal" \
    "$early_fixture_path-shm" \
    "$early_fixture_path-wal" \
    "$missing_event_fixture_path-journal" \
    "$missing_event_fixture_path-shm" \
    "$missing_event_fixture_path-wal" \
    "$app_fixture_path-journal" \
    "$app_fixture_path-shm" \
    "$app_fixture_path-wal"

#!/usr/bin/env bash
# Per-flow precondition for rnw-community/mobile-ci's ios-maestro `pre-flow-command`.
#
# Reads FLOW_PATH, FLOW_NAME, APP_ID and SIMULATOR_UDID from the environment,
# seeds the database fixture the flow declares (if any) over the app's live
# database, and appends the resulting `-e KEY=VALUE` pairs for that one flow to
# $MAESTRO_FLOW_ENV_FILE.
#
# Ported from `seed_ios_database_fixture_if_needed` in run-maestro-suite.sh so
# that mobile-ci's shard runner reproduces the same per-flow seeding the
# hand-rolled suite runner performed.

set -euo pipefail

FLOW_PATH="${FLOW_PATH:?FLOW_PATH is required}"
APP_ID="${APP_ID:?APP_ID is required}"
SIMULATOR_UDID="${SIMULATOR_UDID:?SIMULATOR_UDID is required}"
MAESTRO_FLOW_ENV_FILE="${MAESTRO_FLOW_ENV_FILE:?MAESTRO_FLOW_ENV_FILE is required}"

MAX_SUBFLOW_DEPTH=3

resolve_flow_file_path() {
    local flow_path="$1"
    local nested_flow_path="$2"

    if [[ "$nested_flow_path" = /* ]]; then
        printf '%s\n' "$nested_flow_path"

        return 0
    fi

    printf '%s/%s\n' "$(dirname "$flow_path")" "$nested_flow_path"
}

extract_database_fixture_name() {
    local flow_path="$1"
    local depth="${2:-0}"
    local fixture_name
    local nested_flow_path
    local nested_fixture_name

    fixture_name="$(sed -n "s/^[[:space:]]*FIXTURE_ROW_ID_MATCH:[[:space:]]*['\"]\\([^'\"]*\\.db\\).*['\"].*/\\1/p" "$flow_path" | head -n 1)"

    if [ -n "$fixture_name" ]; then
        printf '%s\n' "$fixture_name"

        return 0
    fi

    if [ "$depth" -ge "$MAX_SUBFLOW_DEPTH" ]; then
        return 1
    fi

    while IFS= read -r nested_flow_path; do
        nested_flow_path="$(resolve_flow_file_path "$flow_path" "$nested_flow_path")"

        if [ ! -f "$nested_flow_path" ]; then
            continue
        fi

        nested_fixture_name="$(extract_database_fixture_name "$nested_flow_path" "$((depth + 1))" || true)"

        if [ -n "$nested_fixture_name" ]; then
            printf '%s\n' "$nested_fixture_name"

            return 0
        fi
    done < <(
        awk '/^[[:space:]]*file:[[:space:]]*/ {
            value = $0;
            sub(/^[[:space:]]*file:[[:space:]]*/, "", value);
            gsub(/'\''|"/, "", value);
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", value);
            if (value ~ /\.flow\.yaml$/) {
                print value;
            }
        }' "$flow_path"
    )

    return 1
}

APP_DATA_CONTAINER="$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data)"

if [ ! -d "$APP_DATA_CONTAINER" ]; then
    echo "::error::App data container for $APP_ID on $SIMULATOR_UDID is not a directory: $APP_DATA_CONTAINER"

    exit 1
fi

# Consumed by subflows/import/import-test-transactions.flow.yaml. Emitted for
# every flow: the URI only points at the once-per-shard CSV fixture directory,
# so flows that do not import a CSV simply never dereference it.
printf 'E2E_CSV_FIXTURES_URI=file://%s/Documents/E2ECsvFixtures\n' "$APP_DATA_CONTAINER" >> "$MAESTRO_FLOW_ENV_FILE"

FIXTURE_NAME="$(extract_database_fixture_name "$FLOW_PATH" || true)"

if [ -z "$FIXTURE_NAME" ]; then
    exit 0
fi

FIXTURE_PATH="$APP_DATA_CONTAINER/Documents/E2EFixtures/$FIXTURE_NAME"

if [ ! -f "$FIXTURE_PATH" ]; then
    echo "::error::Database fixture declared by ${FLOW_NAME:-$FLOW_PATH} was not found: $FIXTURE_PATH"

    exit 1
fi

SQLITE_DIR="$APP_DATA_CONTAINER/Documents/SQLite"

xcrun simctl terminate "$SIMULATOR_UDID" "$APP_ID" >/dev/null 2>&1 || true
xcrun simctl keychain "$SIMULATOR_UDID" reset >/dev/null 2>&1 || true
mkdir -p "$SQLITE_DIR"
rm -f "$SQLITE_DIR"/budgie.db*
cp "$FIXTURE_PATH" "$SQLITE_DIR/budgie.db"
xcrun simctl launch "$SIMULATOR_UDID" "$APP_ID" >/dev/null

printf 'DATABASE_FIXTURE_SEEDED=true\n' >> "$MAESTRO_FLOW_ENV_FILE"

echo "Seeded active iOS database fixture $FIXTURE_NAME for ${FLOW_NAME:-$FLOW_PATH}"

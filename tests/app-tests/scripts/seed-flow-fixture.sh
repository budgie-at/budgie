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

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

. "$SCRIPT_DIR/flow-fixture-lookup.sh"

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

install_database_fixture "$SIMULATOR_UDID" "$APP_ID" "$APP_DATA_CONTAINER" "$FIXTURE_NAME"

printf 'DATABASE_FIXTURE_SEEDED=true\n' >> "$MAESTRO_FLOW_ENV_FILE"

echo "Seeded active iOS database fixture $FIXTURE_NAME for ${FLOW_NAME:-$FLOW_PATH}"

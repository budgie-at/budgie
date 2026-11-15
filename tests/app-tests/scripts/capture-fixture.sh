#!/bin/sh
# Rebuilds one committed database fixture (29.db, 31-debt.db,
# 31-transaction-info.db, 52-passive-income-base.db) through the real UI: e2e/media/fixtures.e2e.ts seeds
# its staged starting fixture, creates the accounts or transactions, and
# writes the app's database to tests/app-tests/fixtures/<name>, on a simulator
# leased from the simlock farm. Reading the database back needs a farm worker
# whose CoreSimulator still runs the Mac's own tools (macOS 15).
#
# Usage:
#   E2E_APP_PATH=<path/to/.app> SIMLOCK_URL=<gateway> SIMLOCK_TOKEN=<agent token> \
#     sh tests/app-tests/scripts/capture-fixture.sh 31-debt.db
# Needs the e2e project's dependencies (`npm ci` in e2e/).
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <fixture-name>   (29.db, 31-debt.db, 31-transaction-info.db or 52-passive-income-base.db)" >&2
    exit 1
fi

case "$1" in
    29.db | 31-debt.db | 31-transaction-info.db | 52-passive-income-base.db) ;;
    *)
        echo "No fixture builder for '$1'; see e2e/media/fixtures.e2e.ts" >&2
        exit 1
        ;;
esac

: "${E2E_APP_PATH:?E2E_APP_PATH is required: the simulator .app to build the fixture with}"
: "${SIMLOCK_URL:?SIMLOCK_URL is required: the simlock gateway}"
: "${SIMLOCK_TOKEN:?SIMLOCK_TOKEN is required: a simlock agent token}"

cd "$PROJECT_ROOT/e2e"
CAPTURE_FIXTURES=1 E2E_WORKERS=1 npx e2e run --config media.config.ts --target ios --grep "^fixture $(printf '%s' "$1" | sed 's/[.]/\\./g')\$"

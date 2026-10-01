#!/usr/bin/env bash
# Regenerates fixtures/screenshots/showcase.db.
#
# Takes the richest committed E2E fixture, applies showcase.sql and compacts the
# result. Run it from anywhere; it only touches files inside
# tests/app-tests/fixtures/screenshots.
#
# Usage: tests/app-tests/fixtures/screenshots/build-showcase.sh

set -euo pipefail

SCREENSHOTS_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
FIXTURES_DIR=$(CDPATH= cd -- "$SCREENSHOTS_DIR/.." && pwd)
BASE_FIXTURE_PATH="$FIXTURES_DIR/29.db"
SHOWCASE_DATABASE_PATH="$SCREENSHOTS_DIR/showcase.db"
WORK_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$WORK_DIR"
}

trap cleanup EXIT

if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "build-showcase: sqlite3 was not found in PATH" >&2

    exit 1
fi

if [ ! -f "$BASE_FIXTURE_PATH" ]; then
    echo "build-showcase: base fixture is missing: $BASE_FIXTURE_PATH" >&2

    exit 1
fi

WORK_DATABASE_PATH="$WORK_DIR/showcase.db"

cp "$BASE_FIXTURE_PATH" "$WORK_DATABASE_PATH"

sqlite3 "$WORK_DATABASE_PATH" < "$SCREENSHOTS_DIR/showcase.sql"
sqlite3 "$WORK_DATABASE_PATH" 'VACUUM;'

INTEGRITY_CHECK=$(sqlite3 "$WORK_DATABASE_PATH" 'PRAGMA integrity_check;')

if [ "$INTEGRITY_CHECK" != "ok" ]; then
    echo "build-showcase: integrity check failed: $INTEGRITY_CHECK" >&2

    exit 1
fi

FOREIGN_KEY_CHECK=$(sqlite3 "$WORK_DATABASE_PATH" 'PRAGMA foreign_key_check;')

if [ -n "$FOREIGN_KEY_CHECK" ]; then
    echo "build-showcase: foreign key check failed: $FOREIGN_KEY_CHECK" >&2

    exit 1
fi

rm -f "$SHOWCASE_DATABASE_PATH"
cp "$WORK_DATABASE_PATH" "$SHOWCASE_DATABASE_PATH"

echo "build-showcase: wrote $SHOWCASE_DATABASE_PATH"

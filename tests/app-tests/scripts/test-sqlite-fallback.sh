#!/bin/bash
# The node:sqlite stand-in (sqlite-fallback/sqlite3) answers as the sqlite3 CLI does for the
# shapes the fixture scripts use: SQL from stdin and as an argument, `.read`, triggers, NULLs,
# duplicate columns, comments; and it fails on an error and on any other dot-command.
set -euo pipefail

if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "test-sqlite-fallback: needs the sqlite3 CLI to compare against" >&2
    exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
STAND_IN="$SCRIPT_DIR/sqlite-fallback/sqlite3"
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

mkdir -p "$TEMP_DIR/shared"
printf "INSERT INTO t VALUES (3, 'it''s');\n" > "$TEMP_DIR/shared/rows.sql"
cat > "$TEMP_DIR/seed.sql" <<'SQL'
-- leading comment
CREATE TABLE t (a INTEGER, b TEXT);
INSERT INTO t VALUES (1, NULL);
.read shared/rows.sql
CREATE TRIGGER t_insert AFTER INSERT ON t BEGIN UPDATE t SET b = 'trigger; fired' WHERE a = new.a; END;
INSERT INTO t VALUES (5, 'x'); -- trailing comment
SQL
QUERY="SELECT a, a, b FROM t ORDER BY a; PRAGMA integrity_check; SELECT COUNT(*) FROM t WHERE b IS NULL;"

run() {
    local tool="$1" database="$TEMP_DIR/$2.db"
    (cd "$TEMP_DIR" && "$tool" -bail "$database" < seed.sql)
    "$tool" "$database" "$QUERY"
}
diff <(run sqlite3 cli) <(run "$STAND_IN" stand-in)

if "$STAND_IN" "$TEMP_DIR/stand-in.db" 'SELECT * FROM missing;' 2>/dev/null; then
    echo "the stand-in succeeded on a failing statement" >&2
    exit 1
fi
if (cd "$TEMP_DIR" && "$STAND_IN" -version 2>/dev/null) || [ -e "$TEMP_DIR/-version" ]; then
    echo "the stand-in answered a probe for the sqlite3 CLI" >&2
    exit 1
fi
if "$STAND_IN" "$TEMP_DIR/stand-in.db" '.tables' 2>/dev/null; then
    echo "the stand-in accepted an unsupported dot-command" >&2
    exit 1
fi
echo "sqlite-fallback: matches the sqlite3 CLI"

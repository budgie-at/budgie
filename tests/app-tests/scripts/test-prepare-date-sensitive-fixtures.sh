#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
TEMP_DIR=$(mktemp -d)
REAL_SQLITE3=$(command -v sqlite3)

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TEMP_DIR/bin" "$TEMP_DIR/scripts" "$TEMP_DIR/fixtures" "$TEMP_DIR/locks"
cp "$SCRIPT_DIR/prepare-date-sensitive-fixtures.js" "$TEMP_DIR/scripts/"
cp "$WORKSPACE_DIR/fixtures/07.db" "$TEMP_DIR/fixtures/"
cp "$WORKSPACE_DIR/fixtures/14.db" "$TEMP_DIR/fixtures/"
cp "$WORKSPACE_DIR/fixtures/31-transaction-info.db" "$TEMP_DIR/fixtures/"
cp "$WORKSPACE_DIR/fixtures/budget-multi-currency.db" "$TEMP_DIR/fixtures/"

cat > "$TEMP_DIR/bin/sqlite3" <<'EOF'
#!/bin/bash
set -euo pipefail

database_path="$1"

wait_for_marker() {
    local marker_path="$1"
    local attempt

    for ((attempt = 1; attempt <= 500; attempt += 1)); do
        if [ -f "$marker_path" ]; then
            return 0
        fi
        sleep 0.01
    done

    echo "Timed out waiting for fixture rendezvous marker: $marker_path" >&2
    return 1
}

case "$database_path" in
    "$MOCK_FIXTURES_DIR/14.db")
        database_name="$(basename "$database_path")"
        lock_path="$MOCK_LOCK_DIR/$database_name.lock"
        ready_path="$MOCK_LOCK_DIR/$database_name.ready-$MOCK_PREPARATION_ID"
        peer_ready_path="$MOCK_LOCK_DIR/$database_name.ready-$MOCK_PEER_PREPARATION_ID"
        peer_attempted_path="$MOCK_LOCK_DIR/$database_name.attempted-$MOCK_PEER_PREPARATION_ID"
        touch "$ready_path"
        wait_for_marker "$peer_ready_path"

        if ! mkdir "$lock_path" 2>/dev/null; then
            touch "$MOCK_LOCK_DIR/$database_name.attempted-$MOCK_PREPARATION_ID"
            echo "Error: database is locked: $database_path" >&2
            exit 5
        fi
        trap 'rmdir "$lock_path"' EXIT
        wait_for_marker "$peer_attempted_path"
        ;;
esac

"$REAL_SQLITE3" "$@"
EOF
chmod +x "$TEMP_DIR/bin/sqlite3"

run_preparation() {
    local output_directory="$1"
    local preparation_id="$2"
    local peer_preparation_id="$3"

    PATH="$TEMP_DIR/bin:$PATH" \
        MOCK_FIXTURES_DIR="$TEMP_DIR/fixtures" \
        MOCK_LOCK_DIR="$TEMP_DIR/locks" \
        MOCK_PREPARATION_ID="$preparation_id" \
        MOCK_PEER_PREPARATION_ID="$peer_preparation_id" \
        REAL_SQLITE3="$REAL_SQLITE3" \
        node "$TEMP_DIR/scripts/prepare-date-sensitive-fixtures.js" "$output_directory"
}

run_preparation "$TEMP_DIR/output-1" 1 2 > "$TEMP_DIR/output-1.log" 2>&1 &
preparation_1_pid=$!
run_preparation "$TEMP_DIR/output-2" 2 1 > "$TEMP_DIR/output-2.log" 2>&1 &
preparation_2_pid=$!

set +e
wait "$preparation_1_pid"
preparation_1_status=$?
wait "$preparation_2_pid"
preparation_2_status=$?
set -e

if [ "$preparation_1_status" -ne 0 ] || [ "$preparation_2_status" -ne 0 ]; then
    cat "$TEMP_DIR/output-1.log"
    cat "$TEMP_DIR/output-2.log"
    exit 1
fi

test -z "$(find "$TEMP_DIR/fixtures" -maxdepth 1 -type f \( -name '*.db-wal' -o -name '*.db-shm' -o -name '*.db-journal' \) -print -quit)"

for output_directory in "$TEMP_DIR/output-1" "$TEMP_DIR/output-2"; do
    for database_name in \
        14.db \
        20-recurring-calendar.db \
        21.db \
        22.db \
        31-transaction-info.db \
        budget-multi-currency.db; do
        test -f "$output_directory/$database_name"
        test "$(sqlite3 "$output_directory/$database_name" 'PRAGMA integrity_check;')" = ok
    done
done

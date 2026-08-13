#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TEMP_DIR=$(mktemp -d)
UDID='00000000-0000-0000-0000-000000000001'
APP_ID='com.example.test'
APP_DATA_CONTAINER="$TEMP_DIR/app-data"
APP_GROUP_CONTAINER="$TEMP_DIR/app-group"
XCRUN_LOG="$TEMP_DIR/xcrun.log"
SETUP_LOG="$TEMP_DIR/setup.log"
INSTALL_LOG="$TEMP_DIR/install.log"
ORDER_LOG="$TEMP_DIR/order.log"

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

mkdir -p "$TEMP_DIR/bin" "$APP_DATA_CONTAINER/Documents" "$APP_GROUP_CONTAINER/captures" "$TEMP_DIR/fixtures/captures"

sqlite3 "$TEMP_DIR/apple-pay-shortcuts-guide.db" 'CREATE TABLE settings (is_screenshot_protection_enabled INTEGER); CREATE TABLE transactions (id INTEGER PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, from_account_id INTEGER, operated_at INTEGER); CREATE TABLE transaction_entries (transaction_id INTEGER NOT NULL, account_id INTEGER NOT NULL, category_id INTEGER, amount INTEGER NOT NULL); INSERT INTO settings VALUES (1); INSERT INTO transactions VALUES (5, "EXPENSE", "Kava Bar", 1, 1786616130); INSERT INTO transaction_entries VALUES (5, 1, 12, 12340000);'
printf '%s\n' '[{"id":1,"title":"Budgie Card"}]' > "$TEMP_DIR/fixtures/accounts.json"
printf '%s\n' '{"captureId":"11111111-1111-4111-8111-111111111111","accountId":1,"amount":12.34,"merchant":"Kava Bar","cardName":"Visa","capturedAt":"2026-08-13T10:15:30.123Z","status":"NEEDS_REVIEW","duplicateTransactionId":5}' > "$TEMP_DIR/fixtures/captures/11111111-1111-4111-8111-111111111111.json"
printf '%s\n' 'stale' > "$APP_GROUP_CONTAINER/accounts.json"
printf '%s\n' 'stale' > "$APP_GROUP_CONTAINER/captures/stale.json"

cat > "$TEMP_DIR/bin/xcrun" <<'EOF'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_XCRUN_LOG"

if [ "$1" = simctl ] && [ "$2" = get_app_container ]; then
    printf '%s\n' "$MOCK_APP_DATA_CONTAINER"
fi
EOF
chmod +x "$TEMP_DIR/bin/xcrun"

cat > "$TEMP_DIR/setup-ios-e2e-fixtures.sh" <<'EOF'
#!/bin/sh
set -eu
printf '%s\n' "setup $*" >> "$MOCK_SETUP_LOG"
printf '%s\n' setup >> "$MOCK_ORDER_LOG"
EOF
chmod +x "$TEMP_DIR/setup-ios-e2e-fixtures.sh"

cat > "$TEMP_DIR/install-ios-db-fixture.sh" <<'EOF'
#!/bin/sh
set -eu
printf '%s\n' install >> "$MOCK_ORDER_LOG"
"$REAL_INSTALL_DB_FIXTURE_SCRIPT" "$@"
EOF
chmod +x "$TEMP_DIR/install-ios-db-fixture.sh"

PATH="$TEMP_DIR/bin:$PATH" \
    MOCK_XCRUN_LOG="$XCRUN_LOG" \
    MOCK_APP_DATA_CONTAINER="$APP_DATA_CONTAINER" \
    MOCK_SETUP_LOG="$SETUP_LOG" \
    MOCK_ORDER_LOG="$ORDER_LOG" \
    REAL_INSTALL_DB_FIXTURE_SCRIPT="$SCRIPT_DIR/../../../scripts/install-ios-db-fixture.sh" \
    APP_DATA_CONTAINER="$APP_DATA_CONTAINER" \
    APP_GROUP_CONTAINER="$APP_GROUP_CONTAINER" \
    GUIDE_DB_FIXTURE_PATH="$TEMP_DIR/apple-pay-shortcuts-guide.db" \
    APP_GROUP_FIXTURE_DIR="$TEMP_DIR/fixtures" \
    SETUP_FIXTURES_SCRIPT="$TEMP_DIR/setup-ios-e2e-fixtures.sh" \
    INSTALL_DB_FIXTURE_SCRIPT="$TEMP_DIR/install-ios-db-fixture.sh" \
    sh "$SCRIPT_DIR/install-apple-pay-shortcuts-guide-fixtures.sh" "$UDID" "$APP_ID" > "$INSTALL_LOG" 2>&1

test "$(sed -n '1p' "$ORDER_LOG")" = setup
test "$(sed -n '2p' "$ORDER_LOG")" = install
test -f "$APP_DATA_CONTAINER/Documents/E2EFixtures/apple-pay-shortcuts-guide.db"
test "$(sqlite3 "$APP_DATA_CONTAINER/Documents/E2EFixtures/apple-pay-shortcuts-guide.db" "SELECT t.title || '|' || t.from_account_id || '|' || e.amount FROM transactions t JOIN transaction_entries e ON e.transaction_id = t.id WHERE t.id = 5;")" = 'Kava Bar|1|12340000'
test -f "$APP_GROUP_CONTAINER/accounts.json"
test -f "$APP_GROUP_CONTAINER/captures/11111111-1111-4111-8111-111111111111.json"
test ! -f "$APP_GROUP_CONTAINER/captures/stale.json"
grep -Fq 'Budgie Card' "$APP_GROUP_CONTAINER/accounts.json"
grep -Fq 'Kava Bar' "$APP_GROUP_CONTAINER/captures/11111111-1111-4111-8111-111111111111.json"
grep -Fq '"duplicateTransactionId":5' "$APP_GROUP_CONTAINER/captures/11111111-1111-4111-8111-111111111111.json"
grep -Fq 'Installed apple-pay-shortcuts-guide.db and Wallet capture App Group seeds' "$INSTALL_LOG"

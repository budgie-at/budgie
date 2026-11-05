#!/bin/bash
# Verifies capture-store-screenshots.sh plans exactly the cells mobile-ci's
# store-screenshots e2e capture plans (per-scene filters, CLI overrides, the
# raw/ios/<slug>/<locale>/<appearance>/<scene>.png layout), hands the plan to
# the e2e project's media capture, and fails closed on a cell it never wrote.
# Runs anywhere: npx is stubbed, so no simulator farm is needed.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TARGET="$SCRIPT_DIR/capture-store-screenshots.sh"
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

FAILURES=0

assert_contains() {
    local haystack="$1" needle="$2" label="$3"
    if grep -qF -- "$needle" <<<"$haystack"; then
        echo "ok   $label"
    else
        echo "FAIL $label: expected to find '$needle'"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_missing() {
    local haystack="$1" needle="$2" label="$3"
    if grep -qF -- "$needle" <<<"$haystack"; then
        echo "FAIL $label: did not expect '$needle'"
        FAILURES=$((FAILURES + 1))
    else
        echo "ok   $label"
    fi
}

assert_fails() {
    local label="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        echo "FAIL $label: expected a non-zero exit"
        FAILURES=$((FAILURES + 1))
    else
        echo "ok   $label"
    fi
}

# A needle near the start of an output larger than a pipe buffer: grep -q stops reading early,
# and an assertion that pipes into it under pipefail misreads the writer's SIGPIPE as a miss.
LARGE_OUTPUT="needle-at-the-start
$(printf 'filler line %s\n' $(seq 1 20000))"
assert_contains "$LARGE_OUTPUT" 'needle-at-the-start' 'a match in a large output is found'
assert_contains "$(assert_missing "$LARGE_OUTPUT" 'needle-at-the-start' 'probe')" 'FAIL probe' 'a match in a large output is never reported missing'

CONFIG="$WORK_DIR/store-screenshots.config.json"
cat > "$CONFIG" <<'JSON'
{
    "ios-target": { "name": "e2e", "appDir": "packages/app", "appId": "com.vitalyiegorov.budgie.e2e" },
    "capture-manifest": [
        {
            "platform": "ios",
            "device": "iPhone 17 Pro Max",
            "locales": ["en", { "id": "uk" }],
            "appearances": ["light", "dark"]
        },
        {
            "platform": "ios",
            "device": "iPad Pro 13-inch (M4)",
            "locales": ["en"],
            "appearances": ["dark"]
        }
    ],
    "capture-scenes": [
        { "name": "01-home", "deepLink": "budgie://", "readySelector": { "id": "HomePage.TotalBalance" } },
        { "name": "02-transactions", "deepLink": "budgie://transactions", "settleSeconds": 7 },
        { "name": "06-account", "test": "net-worth-tracker-2" },
        { "name": "07-settings", "test": "07-settings", "appearances": ["light"] }
    ],
    "settle-seconds": 4,
    "status-bar-override": true
}
JSON

OUT="$WORK_DIR/out"
PLAN=$(bash "$TARGET" --config "$CONFIG" --output "$OUT" --dry-run)
assert_contains "$PLAN" 'device: iPhone 17 Pro Max (slug iphone-17-pro-max)' 'iPhone device slug'
assert_contains "$PLAN" 'device: iPad Pro 13-inch (M4) (slug ipad-pro-13-inch-m4)' 'iPad device slug drops the trailing paren'
assert_contains "$PLAN" 'app-id: com.vitalyiegorov.budgie.e2e' 'app id read from ios-target'
assert_contains "$PLAN" 'iphone-17-pro-max/uk/dark/01-home.png <- budgie:// (settle 4s)' 'object-form locales and the default settle'
assert_contains "$PLAN" 'iphone-17-pro-max/en/light/02-transactions.png <- budgie://transactions (settle 7s)' 'per-scene settleSeconds'
assert_contains "$PLAN" 'iphone-17-pro-max/en/light/06-account.png <- test net-worth-tracker-2' 'a test scene is captured under its scene name'
assert_contains "$PLAN" 'iphone-17-pro-max/en/light/07-settings.png' 'scene appearance filter keeps light'
assert_missing "$PLAN" 'iphone-17-pro-max/en/dark/07-settings.png' 'scene appearance filter drops dark'
assert_contains "$PLAN" 'status-bar: override' 'status bar defaults to the config value'

FILTERED=$(bash "$TARGET" --config "$CONFIG" --output "$OUT" --dry-run --device 'iPhone 17 Pro Max' --locales uk --appearances dark --scenes 01-home --settle 9 --status-bar real)
assert_contains "$FILTERED" 'iphone-17-pro-max/uk/dark/01-home.png <- budgie:// (settle 9s)' 'CLI overrides apply'
assert_contains "$FILTERED" 'status-bar: real' '--status-bar real applies'
assert_contains "$FILTERED" 'cells: 1' '--scenes, --locales and --appearances narrow the plan'
assert_missing "$FILTERED" 'ipad-pro-13-inch-m4' '--device filters other devices'

assert_fails 'unknown argument fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --nope
assert_fails 'invalid --status-bar fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --status-bar loud
assert_fails 'non-integer --settle fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --settle later
assert_fails 'missing config fails closed' bash "$TARGET" --config "$WORK_DIR/absent.json" --dry-run
jq '."capture-scenes" += [{"name": "x", "flow": "flows/x.flow.yaml"}]' "$CONFIG" > "$WORK_DIR/maestro.json"
assert_fails 'a Maestro flow scene fails closed' bash "$TARGET" --config "$WORK_DIR/maestro.json" --dry-run
assert_fails 'no --scenes match fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --scenes nope

# A capture run against a stubbed npx: it records the env the e2e project gets and writes
# every planned PNG unless SKIP names one.
E2E="$WORK_DIR/e2e"
mkdir -p "$E2E/node_modules" "$WORK_DIR/bin" "$WORK_DIR/Base.app"
cat > "$WORK_DIR/bin/npx" <<'STUB'
#!/bin/bash
{
    echo "args: $*"
    echo "device: $SCREENSHOT_DEVICE slug: $SCREENSHOT_DEVICE_SLUG bar: $SCREENSHOT_STATUS_BAR app: $E2E_APP_ID workers: $E2E_WORKERS"
    echo "app-path: $E2E_APP_PATH"
} >> "$NPX_LOG"
jq -r '.[].path' "$SCREENSHOT_PLAN" | while IFS= read -r path; do
    case "$path" in *"${SKIP:-<none>}"*) continue ;; esac
    mkdir -p "$(dirname "$path")"
    printf 'png' > "$path"
done
STUB
chmod +x "$WORK_DIR/bin/npx"
NPX_LOG="$WORK_DIR/npx.log"

run_capture() {
    : > "$NPX_LOG"
    env PATH="$WORK_DIR/bin:$PATH" CAPTURE_E2E_DIR="$E2E" NPX_LOG="$NPX_LOG" SIMLOCK_URL=http://farm.invalid SIMLOCK_TOKEN=t "$@" \
        bash "$TARGET" --config "$CONFIG" --output "$OUT" --app "$WORK_DIR/Base.app" --workers 3
}

mkdir -p "$OUT/raw/ios/iphone-17-pro-max/en/light"
printf 'stale' > "$OUT/raw/ios/iphone-17-pro-max/en/light/old.png"
if run_capture > "$WORK_DIR/run.log" 2>&1; then
    echo "ok   a full capture run succeeds"
else
    echo "FAIL a full capture run succeeds: $(cat "$WORK_DIR/run.log")"
    FAILURES=$((FAILURES + 1))
fi
LOG=$(cat "$NPX_LOG")
assert_contains "$LOG" 'args: e2e run --config media.config.ts --target ios' 'the media capture config runs'
assert_contains "$LOG" 'device: iPhone 17 Pro Max slug: iphone-17-pro-max bar: override app: com.vitalyiegorov.budgie.e2e workers: 3' 'the device, status bar, app id and workers reach the suite'
assert_contains "$LOG" 'device: iPad Pro 13-inch (M4) slug: ipad-pro-13-inch-m4' 'every manifest device gets its own run'
assert_contains "$LOG" "app-path: $WORK_DIR/Base.app" 'the app path is absolute'
[ -f "$OUT/raw/ios/iphone-17-pro-max/uk/dark/06-account.png" ] && echo "ok   cells land in the raw layout" || { echo "FAIL cells land in the raw layout"; FAILURES=$((FAILURES + 1)); }
[ ! -e "$OUT/raw/ios/iphone-17-pro-max/en/light/old.png" ] && echo "ok   a stale capture is cleared" || { echo "FAIL a stale capture is cleared"; FAILURES=$((FAILURES + 1)); }

assert_fails 'a cell the suite never wrote fails the run' run_capture SKIP=uk/dark/06-account.png
assert_fails 'a run without SIMLOCK_TOKEN fails closed' env SIMLOCK_TOKEN= PATH="$WORK_DIR/bin:$PATH" CAPTURE_E2E_DIR="$E2E" SIMLOCK_URL=http://farm.invalid \
    bash "$TARGET" --config "$CONFIG" --output "$OUT" --app "$WORK_DIR/Base.app"

if [ "$FAILURES" -gt 0 ]; then
    echo "$FAILURES assertion(s) failed"
    exit 1
fi
echo "all capture-store-screenshots assertions passed"

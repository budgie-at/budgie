#!/bin/bash
# Verifies capture-store-screenshots.sh resolves its plan from the store
# screenshot config, honours the CLI overrides, and issues the exact simctl
# sequence mobile-ci's capture-screenshots-ios action uses in direct mode.
# Runs anywhere: xcrun and the seed hook are stubbed, so no simulator is needed.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TARGET="$SCRIPT_DIR/capture-store-screenshots.sh"
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

FAILURES=0

assert_contains() {
    local haystack="$1" needle="$2" label="$3"
    if printf '%s' "$haystack" | grep -qF -- "$needle"; then
        echo "ok   $label"
    else
        echo "FAIL $label: expected to find '$needle'"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_missing() {
    local haystack="$1" needle="$2" label="$3"
    if printf '%s' "$haystack" | grep -qF -- "$needle"; then
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
    "capture-mode": "direct",
    "capture-scenes": [
        { "name": "00-prime", "flow": "flows/setup/prime-deep-links-scene.flow.yaml" },
        { "name": "01-home", "deepLink": "budgie://" },
        { "name": "02-transactions", "deepLink": "budgie://transactions", "settleSeconds": 7 },
        { "name": "07-settings", "deepLink": "budgie://settings", "appearances": ["light"] }
    ],
    "screenshots-dir": "tests/app-tests",
    "maestro-config": "tests/app-tests/config.yaml",
    "seed-command": "bash tests/app-tests/scripts/seed-screenshot-scene.sh",
    "settle-seconds": 4,
    "status-bar-override": true
}
JSON

PLAN=$(bash "$TARGET" --config "$CONFIG" --dry-run)

assert_contains "$PLAN" 'device: iPhone 17 Pro Max (slug iphone-17-pro-max)' 'iPhone device slug'
assert_contains "$PLAN" 'device: iPad Pro 13-inch (M4) (slug ipad-pro-13-inch-m4)' 'iPad device slug drops the trailing paren'
assert_contains "$PLAN" 'app-id: com.vitalyiegorov.budgie.e2e' 'app id read from ios-target'
assert_contains "$PLAN" 'locales: en uk' 'object-form locale entries resolve to their id'
assert_contains "$PLAN" 'iphone-17-pro-max/uk/dark/01-home.png <- budgie:// (settle 4s)' 'default settle-seconds'
assert_contains "$PLAN" 'iphone-17-pro-max/en/light/02-transactions.png <- budgie://transactions (settle 7s)' 'per-scene settleSeconds override'
assert_contains "$PLAN" 'iphone-17-pro-max/en/light/07-settings.png' 'scene appearance filter keeps light'
assert_missing "$PLAN" 'iphone-17-pro-max/en/dark/07-settings.png' 'scene appearance filter drops dark'
assert_contains "$PLAN" 'status-bar: override' 'status bar defaults to the config value'
assert_contains "$PLAN" 'os-locale: ci' 'os locale defaults to the mobile-ci behaviour'
assert_contains "$PLAN" 'prime: flows/setup/prime-deep-links-scene.flow.yaml' 'the prime flow comes from the manifest scene'
assert_contains "$PLAN" 'iphone-17-pro-max/en/light/00-prime.png <- flow flows/setup/prime-deep-links-scene.flow.yaml' 'flow-backed scenes are planned as flow cells'

SKIPPED_PRIME=$(bash "$TARGET" --config "$CONFIG" --dry-run --skip-prime)
assert_contains "$SKIPPED_PRIME" 'prime: skipped' '--skip-prime drops the priming pass'

FILTERED=$(bash "$TARGET" --config "$CONFIG" --dry-run --device 'iPhone 17 Pro Max' --locales uk --scenes 01-home --appearances dark --settle 9 --status-bar real --os-locale regional)
assert_contains "$FILTERED" 'iphone-17-pro-max/uk/dark/01-home.png <- budgie:// (settle 9s)' 'CLI overrides apply'
assert_contains "$FILTERED" 'status-bar: real' '--status-bar real applies'
assert_contains "$FILTERED" 'os-locale: regional' '--os-locale regional applies'
assert_missing "$FILTERED" '02-transactions' '--scenes filters other scenes'
assert_missing "$FILTERED" 'ipad-pro-13-inch-m4' '--device filters other devices'

assert_fails 'unknown argument fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --nope
assert_fails 'invalid --status-bar fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --status-bar loud
assert_fails 'invalid --os-locale fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --os-locale klingon
assert_fails 'non-integer --settle fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --settle later
assert_fails 'missing config fails closed' bash "$TARGET" --config "$WORK_DIR/absent.json" --dry-run

echo '{ "capture-mode": "flows", "ios-target": { "appId": "x" }, "capture-manifest": [] }' > "$WORK_DIR/flows.json"
assert_fails 'flows capture-mode fails closed' bash "$TARGET" --config "$WORK_DIR/flows.json" --dry-run

# Full capture run against a stubbed xcrun and a stubbed seed hook, asserting the
# per-cell sequence matches mobile-ci's direct mode.
STUB_BIN="$WORK_DIR/bin"
XCRUN_LOG="$WORK_DIR/xcrun.log"
SEED_LOG="$WORK_DIR/seed.log"
MAESTRO_LOG="$WORK_DIR/maestro.log"
mkdir -p "$STUB_BIN"

cat > "$STUB_BIN/xcrun" <<EOF
#!/bin/bash
printf '%s\n' "\$*" >> "$XCRUN_LOG"
case "\$2" in
    list)
        echo '{"devices":{"com.apple.CoreSimulator.SimRuntime.iOS-26-4":[{"name":"iPhone 17 Pro Max","udid":"OLD-UDID"}],"com.apple.CoreSimulator.SimRuntime.iOS-26-10":[{"name":"iPhone 17 Pro Max","udid":"NEW-UDID"}]}}'
        ;;
    io)
        mkdir -p "\$(dirname "\$5")"
        : > "\$5"
        ;;
esac
exit 0
EOF
chmod +x "$STUB_BIN/xcrun"

# Stands in for the Maestro CLI: records the invocation and drops the single
# takeScreenshot PNG the collector expects into the scratch CWD.
cat > "$STUB_BIN/maestro" <<EOF
#!/bin/bash
printf '%s\n' "\$*" >> "$MAESTRO_LOG"
: > "\$PWD/stub-shot.png"
EOF
chmod +x "$STUB_BIN/maestro"

SEED_HOOK="$WORK_DIR/seed.sh"
cat > "$SEED_HOOK" <<EOF
#!/bin/bash
printf '%s\n' "SCENE=\$SCENE LOCALE=\$LOCALE APPEARANCE=\$APPEARANCE APP_ID=\$APP_ID PLATFORM=\$PLATFORM DEVICE_SLUG=\$DEVICE_SLUG SIMULATOR_UDID=\$SIMULATOR_UDID" >> "$SEED_LOG"
EOF
chmod +x "$SEED_HOOK"

RUN_CONFIG="$WORK_DIR/run.config.json"
sed "s#bash tests/app-tests/scripts/seed-screenshot-scene.sh#bash $SEED_HOOK#" "$CONFIG" > "$RUN_CONFIG"

RUN_OUTPUT="$WORK_DIR/output"
PATH="$STUB_BIN:$PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --device 'iPhone 17 Pro Max' \
    --locales de \
    --appearances light \
    --scenes 02-transactions \
    --output "$RUN_OUTPUT" \
    --skip-install >/dev/null

XCRUN_CALLS=$(cat "$XCRUN_LOG")
assert_contains "$XCRUN_CALLS" 'simctl bootstatus NEW-UDID -b' 'the newest runtime wins the device tie-break'
assert_missing "$XCRUN_CALLS" 'bootstatus OLD-UDID' 'the older runtime candidate is not booted'
assert_contains "$XCRUN_CALLS" 'simctl status_bar NEW-UDID override --time 9:41' 'status bar override is applied'
assert_contains "$XCRUN_CALLS" '--batteryState charged --batteryLevel 100' 'status bar battery matches mobile-ci'
assert_contains "$XCRUN_CALLS" 'simctl spawn NEW-UDID defaults write com.vitalyiegorov.budgie.e2e AppleLanguages -array de' 'OS-level locale preference is written'
assert_contains "$XCRUN_CALLS" 'simctl terminate NEW-UDID com.vitalyiegorov.budgie.e2e' 'the app is terminated per cell'
assert_contains "$XCRUN_CALLS" 'simctl ui NEW-UDID appearance light' 'appearance is applied'
assert_contains "$XCRUN_CALLS" 'simctl launch NEW-UDID com.vitalyiegorov.budgie.e2e -AppleLanguages ("de") -AppleLocale de' 'launch carries the bare locale like mobile-ci'
assert_contains "$XCRUN_CALLS" 'simctl openurl NEW-UDID budgie://transactions' 'the deep link is opened'
assert_contains "$XCRUN_CALLS" "simctl io NEW-UDID screenshot $RUN_OUTPUT/raw/ios/iphone-17-pro-max/de/light/02-transactions.png" 'the screenshot lands in the fixed layout'
assert_contains "$XCRUN_CALLS" 'simctl shutdown NEW-UDID' 'the simulator is shut down so its CoreSimulator workers are reclaimed'

REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
MAESTRO_CALLS=$(cat "$MAESTRO_LOG")
assert_contains "$MAESTRO_CALLS" '--device NEW-UDID test -e APP_ID=com.vitalyiegorov.budgie.e2e' 'the prime flow is pinned to the target simulator'
assert_contains "$MAESTRO_CALLS" '-e LOCALE=de -e APPEARANCE=light' 'the prime flow gets the action-reserved locale and appearance env'
assert_contains "$MAESTRO_CALLS" "--config $REPO_ROOT/tests/app-tests/config.yaml" 'the workspace maestro config is passed as --config'
assert_contains "$MAESTRO_CALLS" "$REPO_ROOT/tests/app-tests/flows/setup/prime-deep-links-scene.flow.yaml" 'the prime flow path resolves against screenshots-dir'
assert_contains "$(cat "$SEED_LOG")" 'SCENE=00-prime LOCALE=de APPEARANCE=light' 'the priming pass seeds the cell like a real capture'

assert_contains "$(cat "$SEED_LOG")" \
    'SCENE=02-transactions LOCALE=de APPEARANCE=light APP_ID=com.vitalyiegorov.budgie.e2e PLATFORM=ios DEVICE_SLUG=iphone-17-pro-max SIMULATOR_UDID=NEW-UDID' \
    'the seed hook receives the full mobile-ci env contract'

if [ -f "$RUN_OUTPUT/raw/ios/iphone-17-pro-max/de/light/02-transactions.png" ]; then
    echo 'ok   the capture file exists at the fixed output path'
else
    echo 'FAIL the capture file is missing from the fixed output path'
    FAILURES=$((FAILURES + 1))
fi

KEPT_BOOTED_BIN="$WORK_DIR/kept-booted-bin"
KEPT_BOOTED_LOG="$WORK_DIR/kept-booted-xcrun.log"
mkdir -p "$KEPT_BOOTED_BIN"
sed "s#$XCRUN_LOG#$KEPT_BOOTED_LOG#" "$STUB_BIN/xcrun" > "$KEPT_BOOTED_BIN/xcrun"
chmod +x "$KEPT_BOOTED_BIN/xcrun"
cp "$STUB_BIN/maestro" "$KEPT_BOOTED_BIN/maestro"
PATH="$KEPT_BOOTED_BIN:$PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --device 'iPhone 17 Pro Max' \
    --locales de \
    --appearances light \
    --scenes 02-transactions \
    --output "$WORK_DIR/kept-booted-output" \
    --skip-install \
    --skip-prime \
    --keep-booted >/dev/null
assert_missing "$(cat "$KEPT_BOOTED_LOG")" 'simctl shutdown' '--keep-booted leaves the simulator running'

# A flow-backed scene captures through Maestro into the same fixed layout.
FLOW_OUTPUT="$WORK_DIR/flow-output"
PATH="$STUB_BIN:$PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --device 'iPhone 17 Pro Max' \
    --locales en \
    --appearances dark \
    --scenes 00-prime \
    --output "$FLOW_OUTPUT" \
    --skip-install \
    --skip-prime >/dev/null

if [ -f "$FLOW_OUTPUT/raw/ios/iphone-17-pro-max/en/dark/00-prime.png" ]; then
    echo 'ok   the flow-backed scene lands in the fixed output layout'
else
    echo 'FAIL the flow-backed scene is missing from the fixed output path'
    FAILURES=$((FAILURES + 1))
fi

# A flow-backed scene that also records a clip keeps the single mp4 alongside
# the PNG, at the same final path with an .mp4 extension.
CLIP_BIN="$WORK_DIR/clip-bin"
mkdir -p "$CLIP_BIN"
cp "$STUB_BIN/xcrun" "$CLIP_BIN/xcrun"
cat > "$CLIP_BIN/maestro" <<EOF
#!/bin/bash
: > "\$PWD/stub-shot.png"
: > "\$PWD/stub-clip.mp4"
EOF
chmod +x "$CLIP_BIN/maestro"

CLIP_OUTPUT="$WORK_DIR/clip-output"
PATH="$CLIP_BIN:$PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --device 'iPhone 17 Pro Max' \
    --locales en \
    --appearances dark \
    --scenes 00-prime \
    --output "$CLIP_OUTPUT" \
    --skip-install \
    --skip-prime >/dev/null

if [ -f "$CLIP_OUTPUT/raw/ios/iphone-17-pro-max/en/dark/00-prime.mp4" ]; then
    echo 'ok   a single recorded clip is moved alongside the PNG'
else
    echo 'FAIL the recorded clip did not land alongside the PNG'
    FAILURES=$((FAILURES + 1))
fi

# mobile-ci retries a failed cell once, so a screenshot that fails on the first
# attempt and succeeds on the second must still produce a passing cell.
FLAKY_BIN="$WORK_DIR/flaky-bin"
FLAKY_LOG="$WORK_DIR/flaky-xcrun.log"
mkdir -p "$FLAKY_BIN"
sed "s#$XCRUN_LOG#$FLAKY_LOG#" "$STUB_BIN/xcrun" > "$FLAKY_BIN/xcrun"
python3 - "$FLAKY_BIN/xcrun" "$WORK_DIR/shot-attempts" <<'PYEOF'
import sys

path, counter = sys.argv[1], sys.argv[2]
source = open(path).read()
open(path, 'w').write(
    source.replace(
        '    io)\n',
        '    io)\n'
        '        printf x >> "%s"\n'
        '        if [ "$(wc -c < "%s")" -le 1 ]; then\n'
        '            exit 1\n'
        '        fi\n' % (counter, counter),
    )
)
PYEOF
chmod +x "$FLAKY_BIN/xcrun"
cp "$STUB_BIN/maestro" "$FLAKY_BIN/maestro"

FLAKY_OUTPUT_DIR="$WORK_DIR/flaky-output"
FLAKY_OUTPUT=$(PATH="$FLAKY_BIN:$PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --device 'iPhone 17 Pro Max' \
    --locales de \
    --appearances light \
    --scenes 02-transactions \
    --output "$FLAKY_OUTPUT_DIR" \
    --skip-install \
    --skip-prime 2>&1)
assert_contains "$FLAKY_OUTPUT" 'attempt 2' 'a failed cell is retried once and reported with its attempt count'

# A seed failure is terminal in mobile-ci: the cell is marked failed without a
# capture and is never retried.
FAILING_SEED="$WORK_DIR/failing-seed.sh"
printf '#!/bin/bash\nexit 1\n' > "$FAILING_SEED"
chmod +x "$FAILING_SEED"
SEED_FAIL_CONFIG="$WORK_DIR/seed-fail.config.json"
sed "s#bash tests/app-tests/scripts/seed-screenshot-scene.sh#bash $FAILING_SEED#" "$CONFIG" > "$SEED_FAIL_CONFIG"
SEED_FAIL_OUTPUT=$(PATH="$STUB_BIN:$PATH" bash "$TARGET" \
    --config "$SEED_FAIL_CONFIG" \
    --device 'iPhone 17 Pro Max' \
    --locales de \
    --appearances light \
    --scenes 02-transactions \
    --output "$WORK_DIR/seed-fail-output" \
    --skip-install \
    --skip-prime 2>&1 || true)
assert_contains "$SEED_FAIL_OUTPUT" 'seed-failed' 'a failed seed is reported'
assert_contains "$SEED_FAIL_OUTPUT" '1 attempt(s)' 'a failed seed is not retried'

# Priming is the one step that cannot fall back to simctl, so a missing Maestro
# must fail loudly instead of capturing the iOS Open confirmation into every PNG.
NO_MAESTRO_BIN="$WORK_DIR/no-maestro-bin"
mkdir -p "$NO_MAESTRO_BIN"
cp "$STUB_BIN/xcrun" "$NO_MAESTRO_BIN/xcrun"
MINIMAL_PATH="$NO_MAESTRO_BIN:$(dirname "$(command -v jq)"):/usr/bin:/bin"
NO_MAESTRO_OUTPUT=$(PATH="$MINIMAL_PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --device 'iPhone 17 Pro Max' \
    --locales en \
    --appearances dark \
    --scenes 01-home \
    --output "$WORK_DIR/no-maestro-output" \
    --skip-install 2>&1 || true)
assert_contains "$NO_MAESTRO_OUTPUT" "'maestro' is required" 'a missing maestro fails the priming pass loudly'
assert_fails 'a missing maestro exits non-zero' env PATH="$MINIMAL_PATH" bash "$TARGET" --config "$RUN_CONFIG" --device 'iPhone 17 Pro Max' --locales en --appearances dark --scenes 01-home --output "$WORK_DIR/no-maestro-output" --skip-install

if [ "$FAILURES" -gt 0 ]; then
    echo "$FAILURES assertion(s) failed"
    exit 1
fi
echo 'All capture-store-screenshots.sh assertions passed'

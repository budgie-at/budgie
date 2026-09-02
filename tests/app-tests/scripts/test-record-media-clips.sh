#!/bin/bash
# Verifies record-media-clips.sh resolves its plan from the landing media config,
# tolerates that config not existing yet, honours the CLI overrides, and issues the
# same per-cell simctl sequence capture-store-screenshots.sh uses.
# Runs anywhere: xcrun, maestro and the seed hook are stubbed, so no simulator and
# no macOS are needed.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TARGET="$SCRIPT_DIR/record-media-clips.sh"
FLOWS_DIR="$SCRIPT_DIR/../flows/media"
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

# Every record wrapper the storyboard names must exist and must be a recording,
# otherwise a cell would silently produce nothing for the encode step to pick up.
WRAPPER_COUNT=$(find "$FLOWS_DIR" -name '*.record.flow.yaml' | wc -l | tr -d ' ')
if [ "$WRAPPER_COUNT" -eq 39 ]; then
    echo 'ok   all 39 storyboard clips have a record wrapper'
else
    echo "FAIL expected 39 record wrappers, found $WRAPPER_COUNT"
    FAILURES=$((FAILURES + 1))
fi

MISSING_RECORDING=$(grep -L 'startRecording' "$FLOWS_DIR"/*.record.flow.yaml || true)
if [ -z "$MISSING_RECORDING" ]; then
    echo 'ok   every record wrapper starts a recording'
else
    printf '%s\n' "$MISSING_RECORDING"
    echo 'FAIL a record wrapper has no startRecording'
    FAILURES=$((FAILURES + 1))
fi

MISSING_STOP=$(grep -L 'stopRecording' "$FLOWS_DIR"/*.record.flow.yaml || true)
if [ -z "$MISSING_STOP" ]; then
    echo 'ok   every record wrapper stops its recording'
else
    printf '%s\n' "$MISSING_STOP"
    echo 'FAIL a record wrapper has no stopRecording'
    FAILURES=$((FAILURES + 1))
fi

# Media flows are capture-only. A launchApp or stopApp in one would restart the app
# mid-clip and break the "starts on the interaction, not on a launch" requirement.
RELAUNCHES=$(grep -l -E '^\s*-?\s*(launchApp|stopApp)' "$FLOWS_DIR"/*.flow.yaml || true)
if [ -z "$RELAUNCHES" ]; then
    echo 'ok   no media flow relaunches the app'
else
    printf '%s\n' "$RELAUNCHES"
    echo 'FAIL a media flow relaunches the app'
    FAILURES=$((FAILURES + 1))
fi

# The E2E suite globs flows/*.flow.yaml, one directory level up. A media flow that
# leaked into that directory would join the suite.
LEAKED=$(find "$SCRIPT_DIR/../flows" -maxdepth 1 -name '*.record.flow.yaml' | wc -l | tr -d ' ')
if [ "$LEAKED" -eq 0 ]; then
    echo 'ok   no record wrapper sits in the E2E suite glob'
else
    echo "FAIL $LEAKED record wrapper(s) leaked into flows/"
    FAILURES=$((FAILURES + 1))
fi

# mobile-ci's capture action collects exactly one takeScreenshot per flow cell and
# fails the cell otherwise, so a still scene flow must emit exactly one and a record
# wrapper none - after resolving the whole runFlow graph, since the continuation
# scenes compose the base flow they extend.
SCREENSHOT_REPORT=$(python3 - "$FLOWS_DIR" <<'PYEOF'
import glob
import os
import re
import sys

base = sys.argv[1]


def parse(path):
    text = open(path).read()
    has_gate = "IS_COMPOSED: ${IS_COMPOSED || 'false'}" in text
    own = len(re.findall(r'takeScreenshot:', text))
    children = []
    for match in re.finditer(r'- runFlow:\n\s+file: ([a-z0-9-]+\.flow\.yaml)\n(\s+env:\n((?:\s{10,}.*\n)+))?', text):
        children.append((match.group(1), "IS_COMPOSED: 'true'" in (match.group(3) or '')))
    for match in re.finditer(r'- runFlow: ([a-z0-9-]+\.flow\.yaml)\n', text):
        children.append((match.group(1), False))
    return has_gate, own, children


def shots(name, composed):
    has_gate, own, children = parse(os.path.join(base, name))
    total = 0 if (composed and has_gate) else own
    for child, child_composed in children:
        total += shots(child, child_composed)
    return total


for path in sorted(glob.glob(os.path.join(base, '*.flow.yaml'))):
    name = os.path.basename(path)
    expected = 0 if name.endswith('.record.flow.yaml') else 1
    count = shots(name, composed=False)
    if count != expected:
        print('%s: expected %d screenshot(s), got %d' % (name, expected, count))
PYEOF
)
if [ -z "$SCREENSHOT_REPORT" ]; then
    echo 'ok   every still scene flow emits exactly one takeScreenshot and every record wrapper none'
else
    printf '%s\n' "$SCREENSHOT_REPORT"
    echo 'FAIL a flow cell would emit the wrong number of screenshots'
    FAILURES=$((FAILURES + 1))
fi

# The still scenes are addressed by name from .github/landing-media.config.json, so a
# scene flow without a SCENE_ID default would capture into an unnamed file.
MISSING_SCENE_ID=$(grep -L 'SCENE_ID' $(find "$FLOWS_DIR" -name '*.flow.yaml' -not -name '*.record.flow.yaml') || true)
if [ -z "$MISSING_SCENE_ID" ]; then
    echo 'ok   every scene flow declares a SCENE_ID default'
else
    printf '%s\n' "$MISSING_SCENE_ID"
    echo 'FAIL a scene flow has no SCENE_ID default'
    FAILURES=$((FAILURES + 1))
fi

CONFIG="$WORK_DIR/landing-media.config.json"
cat > "$CONFIG" <<'JSON'
{
    "ios-target": { "appId": "com.vitalyiegorov.budgie.e2e" },
    "motion-locales": ["en", { "id": "uk" }],
    "motion-appearances": ["light", "dark"],
    "motion-clips": ["theme-toggle", { "id": "pin-unlock" }],
    "maestro-config": "tests/app-tests/config.yaml",
    "seed-command": "bash tests/app-tests/scripts/seed-screenshot-scene.sh",
    "motion-settle-seconds": 3,
    "status-bar-override": true
}
JSON

PLAN=$(bash "$TARGET" --config "$CONFIG" --dry-run)
assert_contains "$PLAN" 'app-id: com.vitalyiegorov.budgie.e2e' 'app id read from ios-target'
assert_contains "$PLAN" 'locales: en uk' 'object-form locale entries resolve to their id'
assert_contains "$PLAN" 'appearances: light dark' 'appearances come from the config'
assert_contains "$PLAN" 'clips: theme-toggle pin-unlock' 'object-form clip entries resolve to their id'
assert_contains "$PLAN" 'settle: 3s' 'motion-settle-seconds is honoured'
assert_contains "$PLAN" 'status-bar: override' 'status bar defaults to the config value'
assert_contains "$PLAN" 'os-locale: ci' 'os locale defaults to the mobile-ci behaviour'
assert_contains "$PLAN" 'theme-toggle/uk/dark/raw.mp4 <- theme-toggle.record.flow.yaml' 'cells resolve to the raw clip layout'

# The landing media config is created by a sibling issue, so its absence must not
# block a local recording run driven entirely by CLI flags.
NO_CONFIG_PLAN=$(bash "$TARGET" --config "$WORK_DIR/absent.json" --dry-run --locales en --appearances dark --clips theme-toggle)
assert_contains "$NO_CONFIG_PLAN" 'config: absent (CLI flags only)' 'a missing config is tolerated'
assert_contains "$NO_CONFIG_PLAN" 'theme-toggle/en/dark/raw.mp4' 'CLI flags fully describe a run without the config'
assert_contains "$NO_CONFIG_PLAN" 'app-id: com.vitalyiegorov.budgie.e2e' 'the E2E bundle id is the fallback app id'

FILTERED=$(bash "$TARGET" --config "$CONFIG" --dry-run --locales uk --appearances light --clips pin-unlock --settle 9 --status-bar real --os-locale regional --skip-prime)
assert_contains "$FILTERED" 'pin-unlock/uk/light/raw.mp4' 'CLI overrides apply'
assert_contains "$FILTERED" 'status-bar: real' '--status-bar real applies'
assert_contains "$FILTERED" 'os-locale: regional' '--os-locale regional applies'
assert_contains "$FILTERED" 'prime: skipped' '--skip-prime drops the priming pass'
assert_missing "$FILTERED" 'theme-toggle' '--clips filters other clips'
assert_missing "$FILTERED" '/en/' '--locales filters other locales'

assert_fails 'unknown argument fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --nope
assert_fails 'invalid --status-bar fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --status-bar loud
assert_fails 'invalid --os-locale fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --os-locale klingon
assert_fails 'non-integer --settle fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --settle later
assert_fails 'unknown appearance fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --appearances sepia
assert_fails 'unknown clip fails closed' bash "$TARGET" --config "$CONFIG" --dry-run --clips no-such-clip
assert_fails 'no clips at all fails closed' bash "$TARGET" --config "$WORK_DIR/absent.json" --dry-run --locales en --appearances dark

# Full recording run against a stubbed xcrun, maestro and seed hook, asserting the
# per-cell sequence matches the store capture runner.
STUB_BIN="$WORK_DIR/bin"
XCRUN_LOG="$WORK_DIR/xcrun.log"
SEED_LOG="$WORK_DIR/seed.log"
MAESTRO_LOG="$WORK_DIR/maestro.log"
mkdir -p "$STUB_BIN"

cat > "$STUB_BIN/xcrun" <<EOF
#!/bin/bash
printf '%s\n' "\$*" >> "$XCRUN_LOG"
exit 0
EOF
chmod +x "$STUB_BIN/xcrun"

# Stands in for the Maestro CLI: records the invocation and drops the single
# recording the collector expects into the scratch CWD.
cat > "$STUB_BIN/maestro" <<EOF
#!/bin/bash
printf '%s\n' "\$*" >> "$MAESTRO_LOG"
: > "\$PWD/stub-clip.mp4"
EOF
chmod +x "$STUB_BIN/maestro"

cat > "$STUB_BIN/perl" <<'EOF'
#!/bin/bash
shift 3
exec "$@"
EOF
chmod +x "$STUB_BIN/perl"

SEED_HOOK="$WORK_DIR/seed.sh"
cat > "$SEED_HOOK" <<EOF
#!/bin/bash
printf '%s\n' "SCENE=\$SCENE LOCALE=\$LOCALE APPEARANCE=\$APPEARANCE APP_ID=\$APP_ID PLATFORM=\$PLATFORM SIMULATOR_UDID=\$SIMULATOR_UDID" >> "$SEED_LOG"
EOF
chmod +x "$SEED_HOOK"

RUN_CONFIG="$WORK_DIR/run.config.json"
sed "s#bash tests/app-tests/scripts/seed-screenshot-scene.sh#bash $SEED_HOOK#" "$CONFIG" > "$RUN_CONFIG"

RUN_OUTPUT="$WORK_DIR/output"
PATH="$STUB_BIN:$PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --udid STUB-UDID \
    --locales de \
    --appearances light \
    --clips theme-toggle \
    --settle 0 \
    --output "$RUN_OUTPUT" \
    --skip-install >/dev/null

XCRUN_CALLS=$(cat "$XCRUN_LOG")
assert_contains "$XCRUN_CALLS" 'simctl bootstatus STUB-UDID -b' 'the target simulator is booted with a bounded bootstatus'
assert_contains "$XCRUN_CALLS" 'simctl status_bar STUB-UDID override --time 9:41' 'status bar override is applied'
assert_contains "$XCRUN_CALLS" '--batteryState charged --batteryLevel 100' 'status bar battery matches the store capture runner'
assert_contains "$XCRUN_CALLS" 'simctl spawn STUB-UDID defaults write com.vitalyiegorov.budgie.e2e AppleLanguages -array de' 'OS-level locale preference is written'
assert_contains "$XCRUN_CALLS" 'simctl terminate STUB-UDID com.vitalyiegorov.budgie.e2e' 'the app is terminated per cell'
assert_contains "$XCRUN_CALLS" 'simctl ui STUB-UDID appearance light' 'appearance is applied'
assert_contains "$XCRUN_CALLS" 'simctl launch STUB-UDID com.vitalyiegorov.budgie.e2e -AppleLanguages ("de") -AppleLocale de' 'launch carries the bare locale like mobile-ci'
assert_contains "$XCRUN_CALLS" 'simctl shutdown STUB-UDID' 'the simulator is shut down so its CoreSimulator workers are reclaimed'
assert_missing "$XCRUN_CALLS" 'simctl io STUB-UDID screenshot' 'a motion cell never takes a screenshot'

REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
MAESTRO_CALLS=$(cat "$MAESTRO_LOG")
assert_contains "$MAESTRO_CALLS" '--device STUB-UDID test -e APP_ID=com.vitalyiegorov.budgie.e2e' 'the wrapper is pinned to the target simulator'
assert_contains "$MAESTRO_CALLS" '-e LOCALE=de -e APPEARANCE=light' 'the wrapper gets the locale and appearance env'
assert_contains "$MAESTRO_CALLS" "--config $REPO_ROOT/tests/app-tests/config.yaml" 'the workspace maestro config is passed as --config'
assert_contains "$MAESTRO_CALLS" "$REPO_ROOT/tests/app-tests/flows/media/theme-toggle.record.flow.yaml" 'the record wrapper path resolves against the flows dir'
assert_contains "$MAESTRO_CALLS" "$REPO_ROOT/tests/app-tests/flows/setup/prime-deep-links.flow.yaml" 'the deep-link trust is primed before the first cell'

SEED_CALLS=$(cat "$SEED_LOG")
assert_contains "$SEED_CALLS" 'SCENE=prime LOCALE=de APPEARANCE=light' 'the priming pass seeds the cell like a real recording'
assert_contains "$SEED_CALLS" \
    'SCENE=theme-toggle LOCALE=de APPEARANCE=light APP_ID=com.vitalyiegorov.budgie.e2e PLATFORM=ios SIMULATOR_UDID=STUB-UDID' \
    'the seed hook receives the clip id as SCENE plus the full env contract'

if [ -f "$RUN_OUTPUT/theme-toggle/de/light/raw.mp4" ]; then
    echo 'ok   the recording lands at the fixed raw path'
else
    echo 'FAIL the recording is missing from the fixed raw path'
    FAILURES=$((FAILURES + 1))
fi

# A wrapper that emits no recording is terminal: the cell must fail rather than
# leave the encode step to discover an empty directory later.
SILENT_BIN="$WORK_DIR/silent-bin"
mkdir -p "$SILENT_BIN"
cp "$STUB_BIN/xcrun" "$SILENT_BIN/xcrun"
cp "$STUB_BIN/perl" "$SILENT_BIN/perl"
cat > "$SILENT_BIN/maestro" <<'EOF'
#!/bin/bash
exit 0
EOF
chmod +x "$SILENT_BIN/maestro"

if PATH="$SILENT_BIN:$PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --udid STUB-UDID \
    --locales de \
    --appearances light \
    --clips theme-toggle \
    --settle 0 \
    --output "$WORK_DIR/silent-output" \
    --skip-install \
    --skip-prime >/dev/null 2>&1; then
    echo 'FAIL a wrapper that records nothing should fail the cell'
    FAILURES=$((FAILURES + 1))
else
    echo 'ok   a wrapper that records nothing fails the cell'
fi

KEPT_BOOTED_BIN="$WORK_DIR/kept-booted-bin"
KEPT_BOOTED_LOG="$WORK_DIR/kept-booted-xcrun.log"
mkdir -p "$KEPT_BOOTED_BIN"
sed "s#$XCRUN_LOG#$KEPT_BOOTED_LOG#" "$STUB_BIN/xcrun" > "$KEPT_BOOTED_BIN/xcrun"
chmod +x "$KEPT_BOOTED_BIN/xcrun"
cp "$STUB_BIN/maestro" "$KEPT_BOOTED_BIN/maestro"
cp "$STUB_BIN/perl" "$KEPT_BOOTED_BIN/perl"
PATH="$KEPT_BOOTED_BIN:$PATH" bash "$TARGET" \
    --config "$RUN_CONFIG" \
    --udid STUB-UDID \
    --locales de \
    --appearances light \
    --clips theme-toggle \
    --settle 0 \
    --output "$WORK_DIR/kept-booted-output" \
    --skip-install \
    --skip-prime \
    --keep-booted >/dev/null
assert_missing "$(cat "$KEPT_BOOTED_LOG")" 'simctl shutdown' '--keep-booted leaves the simulator running'

if [ "$FAILURES" -eq 0 ]; then
    echo 'record-media-clips.sh: all checks passed'
else
    echo "record-media-clips.sh: $FAILURES check(s) failed"
    exit 1
fi

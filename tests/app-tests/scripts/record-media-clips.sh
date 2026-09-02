#!/bin/bash
# Local landing-media clip recorder. Mirrors capture-store-screenshots.sh cell for
# cell so a Mac run and a future CI run produce byte-comparable raw captures - the
# only difference is that a cell ends in a Maestro screen recording instead of a
# simctl screenshot.
#
# Locales, appearances and the clip list come from .github/landing-media.config.json
# when it exists (it is owned by the landing manifest issue and lands separately).
# The file is optional here: every list it would supply can be passed as a CLI flag
# instead, so this runner is usable before that config exists.
#
# Per cell (clip x locale x appearance) it repeats the capture runner's sequence:
#   terminate -> seed-command -> simctl ui appearance -> simctl launch with locale
#   args -> maestro test <clip>.record.flow.yaml -> collect the single .mp4
#
# The record wrapper owns startRecording/stopRecording, so nothing here talks to
# the recorder directly; the runner only supplies APP_ID, LOCALE and APPEARANCE and
# collects whatever single .mp4 the wrapper left in the scratch CWD.
#
# Failed cells are retried once, exactly like the capture runner. A failed seed and
# a wrapper that emitted the wrong number of recordings are terminal and never
# retried. The simulator is shut down when the run finishes so a recording session
# does not leave a booted simulator - and its CoreSimulator workers - behind.
#
# Output layout (gitignored, the encode step reads from it):
#   <output>/<clip>/<locale>/<appearance>/raw.mp4
#
# Usage:
#   bash tests/app-tests/scripts/record-media-clips.sh --udid <udid> [options]
#
#   --udid <udid>           simulator to record on (required unless --dry-run)
#   --app <path>            packaged .app to install (omit with --skip-install)
#   --skip-install          reuse the app already installed on the simulator
#   --locales <a,b>         override the config locales
#   --appearances <a,b>     override the config appearances
#   --clips <a,b>           override the config clip list
#   --config <path>         landing media config (default .github/landing-media.config.json)
#   --app-id <bundle-id>    override the config appId
#   --flows-dir <dir>       directory holding <clip>.record.flow.yaml
#   --output <dir>          raw clip root (default packages/landing/public/media-src/clips)
#   --settle <seconds>      post-recording settle before the next cell
#   --skip-prime            skip the deep-link trust priming flow (already-trusted sim)
#   --keep-booted           leave the simulator booted instead of shutting it down
#   --status-bar real|override   default override (9:41, full bars, 100% battery)
#   --os-locale ci|regional      AppleLocale passed at launch; ci (default) matches mobile-ci
#   --dry-run               print the resolved recording plan and exit
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

CONFIG_PATH="$REPO_ROOT/.github/landing-media.config.json"
OUTPUT_ROOT="$REPO_ROOT/packages/landing/public/media-src/clips"
FLOWS_DIR="$REPO_ROOT/tests/app-tests/flows/media"
MAESTRO_CONFIG="$REPO_ROOT/tests/app-tests/config.yaml"
PRIME_FLOW="$REPO_ROOT/tests/app-tests/flows/setup/prime-deep-links.flow.yaml"
DEFAULT_SEED_COMMAND='bash tests/app-tests/scripts/seed-screenshot-scene.sh'
DEFAULT_APP_ID='com.vitalyiegorov.budgie.e2e'

APP_PATH=''
APP_ID=''
FORCED_UDID=''
LOCALES_OVERRIDE=''
APPEARANCES_OVERRIDE=''
CLIPS_OVERRIDE=''
FLOWS_DIR_OVERRIDE=''
SETTLE_OVERRIDE=''
STATUS_BAR_MODE=''
OS_LOCALE_MODE='ci'
SKIP_INSTALL='false'
SKIP_PRIME='false'
KEEP_BOOTED='false'
DRY_RUN='false'

# Same bounds the capture runner uses: one retry per cell, a wedged simulator gives
# up after five minutes, and the closing shutdown never blocks for more than 30s.
MAX_CELL_ATTEMPTS=2
BOOTSTATUS_TIMEOUT_SECONDS=300
SHUTDOWN_TIMEOUT_SECONDS=30

regional_os_locale() {
    case "$1" in
        en) echo 'en_US' ;;
        fr) echo 'fr_FR' ;;
        uk) echo 'uk_UA' ;;
        de) echo 'de_DE' ;;
        es) echo 'es_ES' ;;
        *) echo "$1" ;;
    esac
}

fail() {
    echo "error: $*" >&2
    exit 1
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --app) APP_PATH="${2:-}"; shift 2 ;;
        --app-id) APP_ID="${2:-}"; shift 2 ;;
        --config) CONFIG_PATH="${2:-}"; shift 2 ;;
        --udid) FORCED_UDID="${2:-}"; shift 2 ;;
        --locales) LOCALES_OVERRIDE="${2:-}"; shift 2 ;;
        --appearances) APPEARANCES_OVERRIDE="${2:-}"; shift 2 ;;
        --clips) CLIPS_OVERRIDE="${2:-}"; shift 2 ;;
        --flows-dir) FLOWS_DIR_OVERRIDE="${2:-}"; shift 2 ;;
        --settle) SETTLE_OVERRIDE="${2:-}"; shift 2 ;;
        --status-bar) STATUS_BAR_MODE="${2:-}"; shift 2 ;;
        --os-locale) OS_LOCALE_MODE="${2:-}"; shift 2 ;;
        --output) OUTPUT_ROOT="${2:-}"; shift 2 ;;
        --skip-install) SKIP_INSTALL='true'; shift ;;
        --skip-prime) SKIP_PRIME='true'; shift ;;
        --keep-booted) KEEP_BOOTED='true'; shift ;;
        --dry-run) DRY_RUN='true'; shift ;;
        -h | --help) sed -n '2,45p' "$0"; exit 0 ;;
        *) fail "unknown argument '$1'" ;;
    esac
done

case "$OS_LOCALE_MODE" in
    ci | regional) ;;
    *) fail "--os-locale must be 'ci' or 'regional', got '$OS_LOCALE_MODE'" ;;
esac

HAS_CONFIG='false'
if [ -f "$CONFIG_PATH" ]; then
    command -v jq >/dev/null 2>&1 || fail "'jq' is required to read $CONFIG_PATH"
    jq -e . "$CONFIG_PATH" >/dev/null 2>&1 || fail "$CONFIG_PATH is not valid JSON"
    HAS_CONFIG='true'
fi

# Reads a config value, tolerating the config file not existing yet.
config_value() {
    [ "$HAS_CONFIG" = 'true' ] || return 0

    jq -r "$1" "$CONFIG_PATH" 2>/dev/null || true
}

config_list() {
    [ "$HAS_CONFIG" = 'true' ] || return 0

    jq -r "$1" "$CONFIG_PATH" 2>/dev/null | tr '\n' ' ' || true
}

split_list() {
    printf '%s' "$1" | tr ',\n\t' '   ' | tr -s ' ' | sed -E 's/^ +//; s/ +$//'
}

if [ -z "$APP_ID" ]; then
    APP_ID=$(config_value '."ios-target" // empty | if type == "string" then fromjson else . end | .appId // empty')
fi
if [ -z "$APP_ID" ]; then
    APP_ID="$DEFAULT_APP_ID"
fi

SEED_COMMAND=$(config_value '."seed-command" // empty')
if [ -z "$SEED_COMMAND" ]; then
    SEED_COMMAND="$DEFAULT_SEED_COMMAND"
fi

CONFIG_MAESTRO=$(config_value '."maestro-config" // empty')
if [ -n "$CONFIG_MAESTRO" ]; then
    case "$CONFIG_MAESTRO" in
        /*) MAESTRO_CONFIG="$CONFIG_MAESTRO" ;;
        *) MAESTRO_CONFIG="$REPO_ROOT/$CONFIG_MAESTRO" ;;
    esac
fi

CONFIG_FLOWS_DIR=$(config_value '."motion-flows-dir" // empty')
if [ -n "$CONFIG_FLOWS_DIR" ]; then
    case "$CONFIG_FLOWS_DIR" in
        /*) FLOWS_DIR="$CONFIG_FLOWS_DIR" ;;
        *) FLOWS_DIR="$REPO_ROOT/$CONFIG_FLOWS_DIR" ;;
    esac
fi
if [ -n "$FLOWS_DIR_OVERRIDE" ]; then
    FLOWS_DIR="$FLOWS_DIR_OVERRIDE"
fi
[ -d "$FLOWS_DIR" ] || fail "no record-wrapper directory at '$FLOWS_DIR'"

CONFIG_SETTLE=$(config_value '."motion-settle-seconds" // empty')
SETTLE_SECONDS="${SETTLE_OVERRIDE:-${CONFIG_SETTLE:-2}}"
case "$SETTLE_SECONDS" in
    '' | *[!0-9]*) fail "--settle must be a non-negative integer, got '$SETTLE_SECONDS'" ;;
esac

if [ -n "$STATUS_BAR_MODE" ]; then
    case "$STATUS_BAR_MODE" in
        real | override) ;;
        *) fail "--status-bar must be 'real' or 'override', got '$STATUS_BAR_MODE'" ;;
    esac
else
    STATUS_BAR_MODE='override'
    if [ "$(config_value '."status-bar-override" // empty')" = 'false' ]; then
        STATUS_BAR_MODE='real'
    fi
fi

LOCALES=$(split_list "${LOCALES_OVERRIDE:-$(config_list '(."motion-locales" // ."capture-manifest"[0].locales // [])[] | if type == "string" then . else .id end')}")
APPEARANCES=$(split_list "${APPEARANCES_OVERRIDE:-$(config_list '(."motion-appearances" // ."capture-manifest"[0].appearances // [])[]')}")
CLIPS=$(split_list "${CLIPS_OVERRIDE:-$(config_list '(."motion-clips" // [])[] | if type == "string" then . else .id end')}")

[ -n "$LOCALES" ] || fail "no locales resolved; pass --locales <a,b> or add motion-locales to $CONFIG_PATH"
[ -n "$APPEARANCES" ] || fail "no appearances resolved; pass --appearances <a,b> or add motion-appearances to $CONFIG_PATH"
[ -n "$CLIPS" ] || fail "no clips resolved; pass --clips <a,b> or add motion-clips to $CONFIG_PATH"

for appearance in $APPEARANCES; do
    case "$appearance" in
        light | dark) ;;
        *) fail "unsupported appearance '$appearance', expected light or dark" ;;
    esac
done

clip_flow_path() {
    printf '%s/%s.record.flow.yaml' "$FLOWS_DIR" "$1"
}

for clip in $CLIPS; do
    [ -f "$(clip_flow_path "$clip")" ] || fail "no record wrapper for clip '$clip' at $(clip_flow_path "$clip")"
done

if [ "$SKIP_INSTALL" = 'false' ] && [ "$DRY_RUN" = 'false' ]; then
    [ -n "$APP_PATH" ] || fail "--app <path/to/.app> is required (or pass --skip-install)"
    [ -d "$APP_PATH" ] || fail "--app '$APP_PATH' is not a .app directory"
fi
if [ -n "$APP_PATH" ]; then
    APP_PATH=$(CDPATH= cd -- "$APP_PATH" && pwd)
fi

if [ "$DRY_RUN" = 'true' ]; then
    echo "recording plan"
    echo "  app-id: $APP_ID"
    echo "  config: $([ "$HAS_CONFIG" = 'true' ] && echo "$CONFIG_PATH" || echo 'absent (CLI flags only)')"
    echo "  flows-dir: $FLOWS_DIR"
    echo "  locales: $LOCALES"
    echo "  appearances: $APPEARANCES"
    echo "  clips: $CLIPS"
    echo "  settle: ${SETTLE_SECONDS}s"
    echo "  status-bar: $STATUS_BAR_MODE"
    echo "  os-locale: $OS_LOCALE_MODE"
    echo "  prime: $([ "$SKIP_PRIME" = 'true' ] && echo 'skipped' || echo "$PRIME_FLOW")"
    for locale in $LOCALES; do
        for appearance in $APPEARANCES; do
            for clip in $CLIPS; do
                echo "  $clip/$locale/$appearance/raw.mp4 <- $(basename "$(clip_flow_path "$clip")")"
            done
        done
    done

    exit 0
fi

command -v xcrun >/dev/null 2>&1 || fail "'xcrun' is required; run this on a Mac with Xcode installed"
command -v maestro >/dev/null 2>&1 || fail "'maestro' is required but is not on PATH (it lives in ~/.maestro/bin)"
[ -n "$FORCED_UDID" ] || fail '--udid <udid> is required; recording always targets one explicit simulator'

# `simctl bootstatus` blocks forever on a wedged simulator, so it is bounded the
# same way the capture runner bounds it - with perl's alarm, since macOS ships no
# `timeout`. Exit 142 is the alarm firing.
boot_simulator() {
    local udid="$1" bootstatus_exit=0

    command -v perl >/dev/null 2>&1 || fail "'perl' is required to bound 'xcrun simctl bootstatus'"
    xcrun simctl boot "$udid" 2>/dev/null || true
    perl -e 'alarm shift; exec @ARGV' "$BOOTSTATUS_TIMEOUT_SECONDS" xcrun simctl bootstatus "$udid" -b >/dev/null ||
        bootstatus_exit=$?
    [ "$bootstatus_exit" -eq 0 ] && return 0
    if [ "$bootstatus_exit" -eq 142 ]; then
        fail "xcrun simctl bootstatus timed out after ${BOOTSTATUS_TIMEOUT_SECONDS}s waiting for simulator '$udid'; it is wedged"
    fi

    fail "xcrun simctl bootstatus failed for simulator '$udid' (exit $bootstatus_exit)"
}

shutdown_simulator() {
    local udid="$1"

    [ "$KEEP_BOOTED" = 'false' ] || return 0
    command -v perl >/dev/null 2>&1 || {
        echo "warning: 'perl' is not on PATH; leaving simulator '$udid' booted" >&2

        return 0
    }
    perl -e 'alarm shift; exec @ARGV' "$SHUTDOWN_TIMEOUT_SECONDS" xcrun simctl shutdown "$udid" >/dev/null 2>&1 ||
        echo "warning: xcrun simctl shutdown timed out or failed for simulator '$udid'" >&2
}

apply_status_bar() {
    [ "$STATUS_BAR_MODE" = 'override' ] || return 0
    xcrun simctl status_bar "$1" override \
        --time '9:41' \
        --dataNetwork wifi \
        --wifiMode active \
        --wifiBars 3 \
        --cellularMode active \
        --cellularBars 4 \
        --batteryState charged \
        --batteryLevel 100
}

set_app_locale_prefs() {
    local udid="$1" locale="$2"
    xcrun simctl spawn "$udid" defaults write "$APP_ID" AppleLanguages -array "$locale" 2>/dev/null ||
        echo "warning: could not write the OS-level AppleLanguages preference for '$APP_ID'" >&2
    xcrun simctl spawn "$udid" defaults write "$APP_ID" AppleLocale -string "$locale" 2>/dev/null ||
        echo "warning: could not write the OS-level AppleLocale preference for '$APP_ID'" >&2
}

# Scratch root for every Maestro invocation: the CLI writes the recording under its
# process CWD rather than --test-output-dir, so each cell needs its own empty CWD to
# collect exactly one .mp4 from. It is created eagerly rather than lazily, because a
# lazy `$(maestro_work_dir)` would run mktemp and its cleanup trap inside a command
# substitution and delete the directory again on that subshell's exit.
MAESTRO_WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/budgie-media-maestro.XXXXXX")
trap 'rm -rf "$MAESTRO_WORK_DIR"' EXIT

maestro_work_dir() {
    printf '%s' "$MAESTRO_WORK_DIR"
}

run_seed_command() {
    local scene="$1" locale="$2" appearance="$3" udid="$4"

    (
        cd "$REPO_ROOT"
        export SCENE="$scene" LOCALE="$locale" APPEARANCE="$appearance" APP_ID="$APP_ID" \
            PLATFORM=ios SIMULATOR_UDID="$udid" APP_PATH="$APP_PATH"
        eval "$SEED_COMMAND"
    )
}

# One recording cell, mirroring capture-store-screenshots.sh's capture_flow_cell:
# absolute flow path, a fresh scratch CWD, the always-passed APP_ID/LOCALE/APPEARANCE,
# the workspace --config, and a single collected .mp4 moved to the cell's final path.
record_clip_cell() {
    local udid="$1" locale="$2" appearance="$3" clip="$4" final_path="$5"
    local flow_path test_output_dir record_cwd clip_count=0 clip_file='' candidate

    flow_path=$(clip_flow_path "$clip")
    test_output_dir="$(maestro_work_dir)/$clip-$locale-$appearance"
    record_cwd="$test_output_dir/record-cwd"
    rm -rf "$test_output_dir"
    mkdir -p "$record_cwd"

    (
        cd "$record_cwd"
        maestro --device "$udid" test \
            -e "APP_ID=$APP_ID" -e "LOCALE=$locale" -e "APPEARANCE=$appearance" \
            --config "$MAESTRO_CONFIG" \
            --test-output-dir "$test_output_dir" "$flow_path"
    ) || return 1

    while IFS= read -r candidate; do
        clip_count=$((clip_count + 1))
        clip_file="$candidate"
    done < <(find "$record_cwd" -type f -name '*.mp4'; find "$test_output_dir" -type f -name '*.mp4' -not -path "$record_cwd/*")
    if [ "$clip_count" -ne 1 ]; then
        echo "  $clip/$locale/$appearance: expected exactly 1 recording, found $clip_count" >&2

        return 2
    fi

    mkdir -p "$(dirname "$final_path")"
    mv "$clip_file" "$final_path"
}

record_cell() {
    local udid="$1" locale="$2" appearance="$3" clip="$4"
    local launch_locale final_path

    launch_locale="$locale"
    if [ "$OS_LOCALE_MODE" = 'regional' ]; then
        launch_locale=$(regional_os_locale "$locale")
    fi
    final_path="$OUTPUT_ROOT/$clip/$locale/$appearance/raw.mp4"

    xcrun simctl terminate "$udid" "$APP_ID" 2>/dev/null || true
    run_seed_command "$clip" "$locale" "$appearance" "$udid" || {
        echo "  $clip/$locale/$appearance: seed-failed" >&2

        return 2
    }
    xcrun simctl ui "$udid" appearance "$appearance"
    xcrun simctl launch "$udid" "$APP_ID" -AppleLanguages "(\"$locale\")" -AppleLocale "$launch_locale" >/dev/null
    record_clip_cell "$udid" "$locale" "$appearance" "$clip" "$final_path" || return $?
    sleep "$SETTLE_SECONDS"
}

# On a fresh install iOS raises its "Open in <app>?" trust alert the first time a
# custom scheme is opened, and every deep-link-first record wrapper would carry it.
# Only a UI driver can tap Open, so the shared prime flow runs once before recording.
prime_deep_links() {
    local udid="$1" locale="$2" appearance="$3"

    if [ "$SKIP_PRIME" = 'true' ]; then
        echo "  prime: skipped (--skip-prime)"

        return 0
    fi

    [ -f "$PRIME_FLOW" ] || fail "no deep-link priming flow at $PRIME_FLOW"
    xcrun simctl terminate "$udid" "$APP_ID" 2>/dev/null || true
    run_seed_command 'prime' "$locale" "$appearance" "$udid" ||
        fail 'seed command failed while priming the deep-link trust'
    xcrun simctl ui "$udid" appearance "$appearance"
    set_app_locale_prefs "$udid" "$locale"
    (
        cd "$(maestro_work_dir)"
        maestro --device "$udid" test \
            -e "APP_ID=$APP_ID" -e "LOCALE=$locale" -e "APPEARANCE=$appearance" \
            --config "$MAESTRO_CONFIG" "$PRIME_FLOW"
    ) || fail "the deep-link trust priming flow failed; every recorded clip would carry the iOS Open confirmation"
    xcrun simctl terminate "$udid" "$APP_ID" 2>/dev/null || true
    echo "  prime: deep-link trust granted via $PRIME_FLOW"
}

echo "recording on $FORCED_UDID"
boot_simulator "$FORCED_UDID"
if [ "$SKIP_INSTALL" = 'false' ]; then
    xcrun simctl install "$FORCED_UDID" "$APP_PATH"
fi
apply_status_bar "$FORCED_UDID"
prime_deep_links "$FORCED_UDID" "${LOCALES%% *}" "${APPEARANCES%% *}"

FAILURES=0
for locale in $LOCALES; do
    set_app_locale_prefs "$FORCED_UDID" "$locale"
    for appearance in $APPEARANCES; do
        for clip in $CLIPS; do
            # A re-record replaces its own cell only, so a partial re-run never
            # leaves a stale mix of old and new clips in one locale directory.
            rm -rf "${OUTPUT_ROOT:?}/$clip/$locale/$appearance"
            attempts=0
            cell_rc=1
            cell_started=$(date +%s)
            while [ "$attempts" -lt "$MAX_CELL_ATTEMPTS" ]; do
                attempts=$((attempts + 1))
                if [ "$attempts" -gt 1 ]; then
                    xcrun simctl terminate "$FORCED_UDID" "$APP_ID" 2>/dev/null || true
                fi
                cell_rc=0
                record_cell "$FORCED_UDID" "$locale" "$appearance" "$clip" || cell_rc=$?
                [ "$cell_rc" -eq 0 ] && break
                [ "$cell_rc" -eq 2 ] && break
            done
            cell_duration=$(( $(date +%s) - cell_started ))
            if [ "$cell_rc" -eq 0 ]; then
                echo "  $locale/$appearance/$clip: recorded (${cell_duration}s, attempt $attempts)"
            else
                echo "  $locale/$appearance/$clip: failed (${cell_duration}s, $attempts attempt(s))" >&2
                FAILURES=$((FAILURES + 1))
            fi
        done
    done
done

xcrun simctl terminate "$FORCED_UDID" "$APP_ID" 2>/dev/null || true
if [ "$STATUS_BAR_MODE" = 'override' ]; then
    xcrun simctl status_bar "$FORCED_UDID" clear || true
fi
shutdown_simulator "$FORCED_UDID"

if [ "$FAILURES" -gt 0 ]; then
    fail "$FAILURES cell(s) failed"
fi
echo "wrote $OUTPUT_ROOT"

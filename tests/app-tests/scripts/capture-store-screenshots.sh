#!/bin/bash
# Local App Store screenshot capture, mirroring mobile-ci's
# capture-screenshots-ios action in direct (deep-link) mode so a Mac run and a
# CI run produce byte-comparable raw captures.
#
# Scenes, locales, appearances and devices are read from the same single source
# of truth CI uses - .github/store-screenshots.config.json - so this script
# never carries its own copy of those lists.
#
# Per deep-link cell (locale x appearance x scene) it repeats CI's exact
# sequence:
#   terminate -> seed-command -> simctl ui appearance -> simctl launch with
#   locale args -> simctl openurl <deepLink> -> settle -> simctl io screenshot
#
# Scenes declared with a `flow` instead of a `deepLink` are run through Maestro
# exactly as the action's capture_flow_cell does - from a fresh scratch CWD, with
# -e APP_ID/LOCALE/APPEARANCE, the config's maestro-config as --config, and the
# flow's single takeScreenshot output moved to the same final path - so a local
# run reproduces CI cell for cell. The one deliberate difference is `--device
# <udid>`: CI has a single booted simulator, a Mac usually does not.
#
# Before the first cell the same prime flow is run once against the target
# simulator. On a fresh install iOS raises its "Open in <app>?" trust alert for
# the first custom-scheme open and it lands in every deep-link capture until it
# is granted; only Maestro can tap it. Use --skip-prime on a simulator that has
# already been trusted.
#
# Output layout is CI's fixed layout and is not configurable:
#   <output>/raw/ios/<device-slug>/<locale>/<appearance>/<scene>.png
#
# Usage:
#   bash tests/app-tests/scripts/capture-store-screenshots.sh --app <path/to/.app> [options]
#
#   --app <path>            packaged .app to install (required unless --skip-install)
#   --skip-install          reuse the app already installed on the simulator
#   --device <name>         exact simulator device name (default: every iOS device in the manifest)
#   --udid <udid>           capture on this already-created simulator instead of resolving --device
#   --locales <a,b>         override the manifest locales
#   --appearances <a,b>     override the manifest appearances
#   --scenes <a,b>          override the manifest scenes
#   --settle <seconds>      override settle-seconds
#   --skip-prime            skip the deep-link trust priming flow (already-trusted sim)
#   --status-bar real|override   default override (9:41, full bars, 100% battery)
#   --os-locale ci|regional      AppleLocale passed at launch; ci (default) matches mobile-ci
#   --output <dir>          screenshots root (default packages/app/fastlane/screenshots)
#   --app-id <bundle-id>    override ios-target.appId
#   --config <path>         override the config file
#   --dry-run               print the resolved capture plan and exit
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

CONFIG_PATH="$REPO_ROOT/.github/store-screenshots.config.json"
OUTPUT_ROOT="$REPO_ROOT/packages/app/fastlane/screenshots"
APP_PATH=''
APP_ID=''
DEVICE_FILTER=''
FORCED_UDID=''
LOCALES_OVERRIDE=''
APPEARANCES_OVERRIDE=''
SCENES_OVERRIDE=''
SETTLE_OVERRIDE=''
STATUS_BAR_MODE=''
OS_LOCALE_MODE='ci'
SKIP_INSTALL='false'
SKIP_PRIME='false'
DRY_RUN='false'
MAESTRO_WORK_DIR=''

# App locale -> regional OS locale identifier, used only by --os-locale regional.
# mobile-ci launches with the bare app locale, so `ci` is the default and the
# regional table exists for deliberately checking region-formatted captures.
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
        --device) DEVICE_FILTER="${2:-}"; shift 2 ;;
        --udid) FORCED_UDID="${2:-}"; shift 2 ;;
        --locales) LOCALES_OVERRIDE="${2:-}"; shift 2 ;;
        --appearances) APPEARANCES_OVERRIDE="${2:-}"; shift 2 ;;
        --scenes) SCENES_OVERRIDE="${2:-}"; shift 2 ;;
        --settle) SETTLE_OVERRIDE="${2:-}"; shift 2 ;;
        --status-bar) STATUS_BAR_MODE="${2:-}"; shift 2 ;;
        --os-locale) OS_LOCALE_MODE="${2:-}"; shift 2 ;;
        --output) OUTPUT_ROOT="${2:-}"; shift 2 ;;
        --skip-install) SKIP_INSTALL='true'; shift ;;
        --skip-prime) SKIP_PRIME='true'; shift ;;
        --dry-run) DRY_RUN='true'; shift ;;
        -h | --help) sed -n '2,48p' "$0"; exit 0 ;;
        *) fail "unknown argument '$1'" ;;
    esac
done

command -v jq >/dev/null 2>&1 || fail "'jq' is required to read $CONFIG_PATH"
[ -f "$CONFIG_PATH" ] || fail "no store screenshot config at $CONFIG_PATH"
jq -e . "$CONFIG_PATH" >/dev/null 2>&1 || fail "$CONFIG_PATH is not valid JSON"

case "$OS_LOCALE_MODE" in
    ci | regional) ;;
    *) fail "--os-locale must be 'ci' or 'regional', got '$OS_LOCALE_MODE'" ;;
esac

if [ -n "$STATUS_BAR_MODE" ]; then
    case "$STATUS_BAR_MODE" in
        real | override) ;;
        *) fail "--status-bar must be 'real' or 'override', got '$STATUS_BAR_MODE'" ;;
    esac
else
    STATUS_BAR_MODE='override'
    if [ "$(jq -r '."status-bar-override" // true' "$CONFIG_PATH")" = 'false' ]; then
        STATUS_BAR_MODE='real'
    fi
fi

# mobile-ci accepts ios-target either as a config key or as a `with:` input on
# the caller workflow, and Budgie's caller passes it as an input, so the config
# file may carry no app id at all. Fall back to the E2E bundle id the capture
# build always uses - the same one tests/app-tests' test:ios script pins.
if [ -z "$APP_ID" ]; then
    APP_ID=$(jq -r '."ios-target" // empty | if type == "string" then fromjson else . end | .appId // empty' "$CONFIG_PATH")
fi
if [ -z "$APP_ID" ]; then
    APP_ID='com.vitalyiegorov.budgie.e2e'
fi

SEED_COMMAND=$(jq -r '."seed-command" // empty' "$CONFIG_PATH")

# Flow-backed scenes resolve their `flow` against screenshots-dir and are handed
# maestro-config as --config, both exactly as mobile-ci resolves them: relative to
# the repository root, which is the capture job's working directory.
SCREENSHOTS_DIR=$(jq -r '."screenshots-dir" // empty' "$CONFIG_PATH")
if [ -n "$SCREENSHOTS_DIR" ]; then
    case "$SCREENSHOTS_DIR" in
        /*) ;;
        *) SCREENSHOTS_DIR="$REPO_ROOT/$SCREENSHOTS_DIR" ;;
    esac
fi
MAESTRO_CONFIG=$(jq -r '."maestro-config" // empty' "$CONFIG_PATH")
MAESTRO_CONFIG_ARGS=()
if [ -n "$MAESTRO_CONFIG" ]; then
    case "$MAESTRO_CONFIG" in
        /*) ;;
        *) MAESTRO_CONFIG="$REPO_ROOT/$MAESTRO_CONFIG" ;;
    esac
    [ -f "$MAESTRO_CONFIG" ] || fail "maestro-config '$MAESTRO_CONFIG' is not a file"
    MAESTRO_CONFIG_ARGS=(--config "$MAESTRO_CONFIG")
fi

# The priming pass reuses the manifest's first flow-backed scene, so the local
# run and CI grant the deep-link trust with the same flow.
PRIME_SCENE_NAME=$(jq -r '[."capture-scenes"[] | select(has("flow"))][0].name // empty' "$CONFIG_PATH")
PRIME_FLOW=$(jq -r '[."capture-scenes"[] | select(has("flow"))][0].flow // empty' "$CONFIG_PATH")
SETTLE_SECONDS="${SETTLE_OVERRIDE:-$(jq -r '."settle-seconds" // 3' "$CONFIG_PATH")}"
case "$SETTLE_SECONDS" in
    '' | *[!0-9]*) fail "--settle must be a non-negative integer, got '$SETTLE_SECONDS'" ;;
esac

if [ "$(jq -r '."capture-mode" // "flows"' "$CONFIG_PATH")" != 'direct' ]; then
    fail "$CONFIG_PATH is not in capture-mode 'direct'; this runner only mirrors direct (deep-link) capture"
fi

if [ "$SKIP_INSTALL" = 'false' ] && [ "$DRY_RUN" = 'false' ]; then
    [ -n "$APP_PATH" ] || fail "--app <path/to/.app> is required (or pass --skip-install)"
    [ -d "$APP_PATH" ] || fail "--app '$APP_PATH' is not a .app directory"
fi
if [ -n "$APP_PATH" ]; then
    APP_PATH=$(CDPATH= cd -- "$APP_PATH" && pwd)
fi

# Same slug rule as mobile-ci: lowercased, every run of non-alphanumerics
# collapsed to a single hyphen, no leading or trailing hyphen.
device_slug() {
    printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

split_list() {
    printf '%s' "$1" | tr ',\n\t' '   ' | tr -s ' ' | sed -E 's/^ +//; s/ +$//'
}

manifest_devices() {
    jq -r '."capture-manifest"[] | select((.platform // "ios") == "ios") | .device' "$CONFIG_PATH"
}

manifest_locales() {
    jq -r --arg device "$1" \
        '."capture-manifest"[] | select((.platform // "ios") == "ios") | select(.device == $device) | .locales[] | if type == "string" then . else .id end' \
        "$CONFIG_PATH"
}

manifest_appearances() {
    jq -r --arg device "$1" \
        '."capture-manifest"[] | select((.platform // "ios") == "ios") | select(.device == $device) | .appearances[]' \
        "$CONFIG_PATH"
}

# Scene fields, pipe-separated, honouring the per-scene platforms/locales/
# appearances filters and settleSeconds override exactly as CI does. A scene
# carries either a deep link or a flow, so one of those two fields is always
# empty - and `|` is used rather than a tab because bash collapses runs of
# IFS whitespace and would silently shift the remaining fields left.
scene_rows() {
    jq -r --arg locale "$1" --arg appearance "$2" --argjson settle "$SETTLE_SECONDS" '
        ."capture-scenes"[]
        | select((.platforms // ["ios"]) | index("ios"))
        | select((.locales // null) == null or (.locales | index($locale)))
        | select((.appearances // null) == null or (.appearances | index($appearance)))
        | [.name, (.deepLink // ""), (.flow // ""), (.settleSeconds // $settle)]
        | map(tostring)
        | join("|")
    ' "$CONFIG_PATH"
}

scene_is_selected() {
    [ -n "$SCENES_OVERRIDE" ] || return 0

    printf '%s\n' "$(split_list "$SCENES_OVERRIDE")" | tr ' ' '\n' | grep -qFx "$1"
}

SELECTED_DEVICES=()
if [ -n "$DEVICE_FILTER" ]; then
    SELECTED_DEVICES=("$DEVICE_FILTER")
else
    while IFS= read -r manifest_device; do
        [ -n "$manifest_device" ] && SELECTED_DEVICES+=("$manifest_device")
    done <<< "$(manifest_devices)"
fi
[ "${#SELECTED_DEVICES[@]}" -gt 0 ] || fail "no iOS entries in $CONFIG_PATH capture-manifest"

if [ -n "$FORCED_UDID" ] && [ "${#SELECTED_DEVICES[@]}" -gt 1 ]; then
    fail "--udid pins one simulator; pass --device <name> to pick which manifest entry it captures"
fi

# Resolves an exact simulator name to a UDID the same way mobile-ci does:
# no fuzzy matching, several runtimes resolve to the newest one, two devices of
# the same name under the same runtime fail closed.
resolve_device_udid() {
    local device_name="$1" candidates newest
    candidates=$(xcrun simctl list -j devices available | jq -r --arg name "$device_name" '
        .devices
        | to_entries[]
        | .key as $runtime
        | .value[]
        | select(.name == $name)
        | [$runtime, .udid]
        | @tsv
    ')
    [ -n "$candidates" ] || {
        echo "available simulators:" >&2
        xcrun simctl list devices available >&2
        fail "no available simulator named '$device_name'"
    }

    # Runtime identifiers (com.apple.CoreSimulator.SimRuntime.iOS-26-10) are
    # ordered by their numeric components, not lexically, so iOS-26-10 beats
    # iOS-26-9. `sort -V` is not portable to the BSD sort on older macOS, so the
    # key is built by zero-padding each component instead.
    newest=$(printf '%s\n' "$candidates" | cut -f1 | sort -u | awk '{
        key = ""
        rest = $0
        while (match(rest, /[0-9]+/)) {
            key = key sprintf("%08d.", substr(rest, RSTART, RLENGTH) + 0)
            rest = substr(rest, RSTART + RLENGTH)
        }
        print key "\t" $0
    }' | sort | tail -n 1 | cut -f2)

    if [ "$(printf '%s\n' "$candidates" | cut -f1 | grep -cFx "$newest")" -gt 1 ]; then
        printf '%s\n' "$candidates" >&2
        fail "several simulators named '$device_name' under runtime '$newest'; delete the duplicates"
    fi

    printf '%s\n' "$candidates" | awk -F'\t' -v runtime="$newest" '$1 == runtime { print $2 }'
}

boot_simulator() {
    xcrun simctl boot "$1" 2>/dev/null || true
    xcrun simctl bootstatus "$1" -b >/dev/null
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

require_maestro() {
    command -v maestro >/dev/null 2>&1 ||
        fail "'maestro' is required for $1 but is not on PATH (it lives in ~/.maestro/bin); install it, or pass --skip-prime if this simulator has already granted the deep-link trust and no flow-backed scene is selected"
}

# Scratch root for every Maestro invocation: the CLI writes a relative
# takeScreenshot name into its process CWD rather than --test-output-dir, so each
# run needs its own empty CWD to collect exactly one PNG from.
maestro_work_dir() {
    if [ -z "$MAESTRO_WORK_DIR" ]; then
        MAESTRO_WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/budgie-capture-maestro.XXXXXX")
        trap 'rm -rf "$MAESTRO_WORK_DIR"' EXIT
    fi

    printf '%s' "$MAESTRO_WORK_DIR"
}

# mobile-ci's capture_flow_cell, one for one: absolute flow path, a fresh scratch
# CWD, the always-passed APP_ID/LOCALE/APPEARANCE, the workspace --config, and a
# single collected takeScreenshot PNG moved to the cell's final path.
capture_flow_cell() {
    local udid="$1" locale="$2" appearance="$3" scene="$4" flow="$5" final_path="$6"
    local flow_path test_output_dir shot_cwd shot_count=0 shot_file='' candidate

    [ -n "$SCREENSHOTS_DIR" ] || fail "scene '$scene' declares a flow but the config has no screenshots-dir"
    flow_path="$SCREENSHOTS_DIR/$flow"
    [ -f "$flow_path" ] || fail "scene '$scene' flow '$flow' does not exist under screenshots-dir '$SCREENSHOTS_DIR'"

    test_output_dir="$(maestro_work_dir)/$locale-$appearance-$scene"
    shot_cwd="$test_output_dir/shot-cwd"
    rm -rf "$test_output_dir"
    mkdir -p "$shot_cwd"

    (
        cd "$shot_cwd"
        maestro --device "$udid" test \
            -e "APP_ID=$APP_ID" -e "LOCALE=$locale" -e "APPEARANCE=$appearance" \
            ${MAESTRO_CONFIG_ARGS[@]+"${MAESTRO_CONFIG_ARGS[@]}"} \
            --test-output-dir "$test_output_dir" "$flow_path"
    ) || return 1

    while IFS= read -r candidate; do
        shot_count=$((shot_count + 1))
        shot_file="$candidate"
    done < <(find "$shot_cwd" -type f -name '*.png'; find "$test_output_dir" -type f -path '*takeScreenshot/*.png' -not -path "$shot_cwd/*")
    if [ "$shot_count" -ne 1 ]; then
        echo "  $locale/$appearance/$scene: expected exactly 1 takeScreenshot PNG, found $shot_count" >&2

        return 1
    fi

    mkdir -p "$(dirname "$final_path")"
    mv "$shot_file" "$final_path"
}

# On a fresh install iOS raises its "Open in <app>?" trust alert the first time a
# custom scheme is opened - `simctl openurl` included - and it stays on screen
# through the settle, so every deep-link capture of that run contains it. Only a
# UI driver can tap Open, so the manifest's flow-backed prime scene is run once
# per install, seeded and themed like a real cell, before anything is captured.
prime_deep_links() {
    local udid="$1" device_slug="$2" locale="$3" appearance="$4"

    if [ "$SKIP_PRIME" = 'true' ]; then
        echo "  prime: skipped (--skip-prime)"

        return 0
    fi

    [ -n "$PRIME_FLOW" ] || fail "no flow-backed scene in $CONFIG_PATH to prime the deep-link trust with; pass --skip-prime to capture without priming"
    require_maestro "the '$PRIME_SCENE_NAME' deep-link trust priming flow"

    xcrun simctl terminate "$udid" "$APP_ID" 2>/dev/null || true
    run_seed_command "$PRIME_SCENE_NAME" "$locale" "$appearance" "$device_slug" "$udid" ||
        fail "seed command failed while priming the deep-link trust"
    xcrun simctl ui "$udid" appearance "$appearance"
    set_app_locale_prefs "$udid" "$locale"
    capture_flow_cell "$udid" "$locale" "$appearance" "$PRIME_SCENE_NAME" "$PRIME_FLOW" "$(maestro_work_dir)/prime.png" ||
        fail "the deep-link trust priming flow '$PRIME_FLOW' failed; every deep-link capture would carry the iOS Open confirmation"
    rm -f "$(maestro_work_dir)/prime.png"
    xcrun simctl terminate "$udid" "$APP_ID" 2>/dev/null || true
    echo "  prime: deep-link trust granted via $PRIME_FLOW"
}

run_seed_command() {
    local scene="$1" locale="$2" appearance="$3" device_slug="$4" udid="$5"
    [ -n "$SEED_COMMAND" ] || return 0

    (
        cd "$REPO_ROOT"
        export SCENE="$scene" LOCALE="$locale" APPEARANCE="$appearance" APP_ID="$APP_ID" \
            PLATFORM=ios DEVICE_SLUG="$device_slug" SIMULATOR_UDID="$udid" APP_PATH="$APP_PATH"
        eval "$SEED_COMMAND"
    )
}

capture_cell() {
    local udid="$1" device_slug="$2" locale="$3" appearance="$4" scene="$5" deep_link="$6" flow="$7" settle="$8"
    local launch_locale final_path

    launch_locale="$locale"
    if [ "$OS_LOCALE_MODE" = 'regional' ]; then
        launch_locale=$(regional_os_locale "$locale")
    fi
    final_path="$OUTPUT_ROOT/raw/ios/$device_slug/$locale/$appearance/$scene.png"
    mkdir -p "$(dirname "$final_path")"

    xcrun simctl terminate "$udid" "$APP_ID" 2>/dev/null || true
    run_seed_command "$scene" "$locale" "$appearance" "$device_slug" "$udid" || {
        echo "  $locale/$appearance/$scene: seed-failed" >&2
        return 1
    }
    xcrun simctl ui "$udid" appearance "$appearance"
    if [ -n "$flow" ]; then
        capture_flow_cell "$udid" "$locale" "$appearance" "$scene" "$flow" "$final_path"

        return
    fi
    xcrun simctl launch "$udid" "$APP_ID" -AppleLanguages "(\"$locale\")" -AppleLocale "$launch_locale" >/dev/null
    xcrun simctl openurl "$udid" "$deep_link"
    sleep "$settle"
    xcrun simctl io "$udid" screenshot "$final_path" >/dev/null
}

capture_device() {
    local device_name="$1"
    local slug udid locales appearances failures locale appearance scene deep_link flow settle scene_source
    slug=$(device_slug "$device_name")

    locales="$(split_list "${LOCALES_OVERRIDE:-$(manifest_locales "$device_name" | tr '\n' ' ')}")"
    appearances="$(split_list "${APPEARANCES_OVERRIDE:-$(manifest_appearances "$device_name" | tr '\n' ' ')}")"
    [ -n "$locales" ] || fail "no locales resolved for device '$device_name'"
    [ -n "$appearances" ] || fail "no appearances resolved for device '$device_name'"

    if [ "$DRY_RUN" = 'true' ]; then
        echo "device: $device_name (slug $slug)"
        echo "  app-id: $APP_ID"
        echo "  locales: $locales"
        echo "  appearances: $appearances"
        echo "  status-bar: $STATUS_BAR_MODE"
        echo "  os-locale: $OS_LOCALE_MODE"
        echo "  prime: $([ "$SKIP_PRIME" = 'true' ] && echo 'skipped' || echo "$PRIME_FLOW")"
        for locale in $locales; do
            for appearance in $appearances; do
                while IFS='|' read -r scene deep_link flow settle; do
                    [ -n "$scene" ] || continue
                    scene_is_selected "$scene" || continue
                    scene_source="$deep_link (settle ${settle}s)"
                    if [ -n "$flow" ]; then
                        scene_source="flow $flow"
                    fi
                    echo "  $slug/$locale/$appearance/$scene.png <- $scene_source"
                done <<< "$(scene_rows "$locale" "$appearance")"
            done
        done

        return 0
    fi

    if [ -n "$FORCED_UDID" ]; then
        udid="$FORCED_UDID"
    else
        udid=$(resolve_device_udid "$device_name")
    fi
    echo "capturing $device_name ($slug) on $udid"

    boot_simulator "$udid"
    if [ "$SKIP_INSTALL" = 'false' ]; then
        xcrun simctl install "$udid" "$APP_PATH"
    fi
    apply_status_bar "$udid"
    prime_deep_links "$udid" "$slug" "${locales%% *}" "${appearances%% *}"

    # CI clears raw/ios/<device-slug> per run so a reused output directory can
    # never republish a stale scene from an earlier matrix. A single-scene or
    # single-locale re-capture therefore replaces the whole device directory
    # rather than patching one PNG into it.
    rm -rf "${OUTPUT_ROOT:?}/raw/ios/$slug"

    failures=0
    for locale in $locales; do
        set_app_locale_prefs "$udid" "$locale"
        for appearance in $appearances; do
            while IFS='|' read -r scene deep_link flow settle; do
                [ -n "$scene" ] || continue
                scene_is_selected "$scene" || continue
                if [ -n "$flow" ]; then
                    require_maestro "flow-backed scene '$scene'"
                fi
                if capture_cell "$udid" "$slug" "$locale" "$appearance" "$scene" "$deep_link" "$flow" "$settle"; then
                    echo "  $locale/$appearance/$scene: captured"
                else
                    echo "  $locale/$appearance/$scene: failed" >&2
                    failures=$((failures + 1))
                fi
            done <<< "$(scene_rows "$locale" "$appearance")"
        done
    done

    xcrun simctl terminate "$udid" "$APP_ID" 2>/dev/null || true
    if [ "$STATUS_BAR_MODE" = 'override' ]; then
        xcrun simctl status_bar "$udid" clear || true
    fi

    if [ "$failures" -gt 0 ]; then
        fail "$failures cell(s) failed for '$device_name'"
    fi
    echo "wrote $OUTPUT_ROOT/raw/ios/$slug"
}

if [ "$DRY_RUN" = 'false' ]; then
    command -v xcrun >/dev/null 2>&1 || fail "'xcrun' is required; run this on a Mac with Xcode installed"
fi

for selected_device in "${SELECTED_DEVICES[@]}"; do
    capture_device "$selected_device"
done

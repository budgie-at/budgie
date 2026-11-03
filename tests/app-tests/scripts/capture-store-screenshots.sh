#!/bin/bash
# Local store, landing and social screenshot capture through the e2e
# project's media capture (e2e/media.config.ts), against simulators leased
# from the simlock farm: the same capture rnw-community/mobile-ci's
# store-screenshots.yml runs with test-framework: e2e, so a local run and a CI
# run produce byte-comparable raw captures.
#
# Scenes, locales, appearances and devices are read from a capture config
# (default .github/store-screenshots.config.json; --config
# .github/landing-media.config.json or a social-capture.config.json), so this
# script never carries its own copy of those lists. Per device it writes the
# plan mobile-ci writes - one cell per locale x appearance x scene, with each
# scene's platforms/locales/appearances filters - and hands it to the e2e
# project, which seeds every cell (seed-screenshot-scene.sh), drives a `test`
# scene or opens a `deepLink` one, and writes the PNG pixel for pixel.
#
# Output layout is CI's fixed layout and is not configurable:
#   <output>/raw/ios/<device-slug>/<locale>/<appearance>/<scene>.png
# A scene that records a clip (app-store-preview) leaves <scene>.mp4 beside it.
#
# Needs SIMLOCK_URL and SIMLOCK_TOKEN (a simlock agent token; see the farm's
# handoff), Node 24, and the e2e project's dependencies
# (`npm ci` in e2e/). Runs on Linux or a Mac alike: no local simulator is used.
#
# Usage:
#   bash tests/app-tests/scripts/capture-store-screenshots.sh --app <path/to/.app> [options]
#
#   --app <path>            simulator .app to install on every leased simulator (required)
#   --device <name>         exact simulator model (default: every iOS device in the manifest)
#   --locales <a,b>         override the manifest locales
#   --appearances <a,b>     override the manifest appearances
#   --scenes <a,b>          capture only these scenes
#   --settle <seconds>      override settle-seconds (deep-link scenes)
#   --status-bar real|override   default override (9:41, full bars, 100% battery)
#   --workers <n>           simulators leased at once per device (default 4)
#   --output <dir>          screenshots root (default packages/app/fastlane/screenshots)
#   --app-id <bundle-id>    override ios-target.appId
#   --config <path>         override the config file
#   --dry-run               print the resolved capture plan and exit
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
E2E_DIR="${CAPTURE_E2E_DIR:-$REPO_ROOT/e2e}"

CONFIG_PATH="$REPO_ROOT/.github/store-screenshots.config.json"
OUTPUT_ROOT="$REPO_ROOT/packages/app/fastlane/screenshots"
APP_PATH=''
APP_ID=''
DEVICE_FILTER=''
LOCALES_OVERRIDE=''
APPEARANCES_OVERRIDE=''
SCENES_OVERRIDE=''
SETTLE_OVERRIDE=''
STATUS_BAR_MODE=''
WORKERS=4
DRY_RUN='false'

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
        --locales) LOCALES_OVERRIDE="${2:-}"; shift 2 ;;
        --appearances) APPEARANCES_OVERRIDE="${2:-}"; shift 2 ;;
        --scenes) SCENES_OVERRIDE="${2:-}"; shift 2 ;;
        --settle) SETTLE_OVERRIDE="${2:-}"; shift 2 ;;
        --status-bar) STATUS_BAR_MODE="${2:-}"; shift 2 ;;
        --workers) WORKERS="${2:-}"; shift 2 ;;
        --output) OUTPUT_ROOT="${2:-}"; shift 2 ;;
        --dry-run) DRY_RUN='true'; shift ;;
        -h | --help) sed -n '2,40p' "$0"; exit 0 ;;
        *) fail "unknown argument '$1'" ;;
    esac
done

command -v jq >/dev/null 2>&1 || fail "'jq' is required to read $CONFIG_PATH"
[ -f "$CONFIG_PATH" ] || fail "no capture config at $CONFIG_PATH"
jq -e . "$CONFIG_PATH" >/dev/null 2>&1 || fail "$CONFIG_PATH is not valid JSON"

if [ "$(jq -r '."capture-mode" // "flows"' "$CONFIG_PATH")" != 'direct' ]; then
    fail "$CONFIG_PATH is not in capture-mode 'direct'; the e2e capture takes a capture-scenes manifest"
fi
flow_scenes=$(jq -r '[."capture-scenes"[] | select(has("flow")) | .name] | join(", ")' "$CONFIG_PATH")
[ -z "$flow_scenes" ] || fail "scenes $flow_scenes declare a Maestro flow; name their e2e scene with 'test' (e2e/support/media/scenes.ts)"

if [ -n "$STATUS_BAR_MODE" ]; then
    case "$STATUS_BAR_MODE" in
        real | override) ;;
        *) fail "--status-bar must be 'real' or 'override', got '$STATUS_BAR_MODE'" ;;
    esac
elif [ "$(jq -r '."status-bar-override" // true' "$CONFIG_PATH")" = 'false' ]; then
    STATUS_BAR_MODE='real'
else
    STATUS_BAR_MODE='override'
fi

case "$WORKERS" in
    '' | *[!0-9]* | 0) fail "--workers must be a positive integer, got '$WORKERS'" ;;
esac

SETTLE_SECONDS="${SETTLE_OVERRIDE:-$(jq -r '."settle-seconds" // 3' "$CONFIG_PATH")}"
case "$SETTLE_SECONDS" in
    '' | *[!0-9]*) fail "--settle must be a non-negative integer, got '$SETTLE_SECONDS'" ;;
esac

if [ -z "$APP_ID" ]; then
    APP_ID=$(jq -r '."ios-target" // empty | if type == "string" then fromjson else . end | .appId // empty' "$CONFIG_PATH")
fi
APP_ID="${APP_ID:-com.vitalyiegorov.budgie.e2e}"

if [ "$DRY_RUN" = 'false' ]; then
    [ -n "$APP_PATH" ] || fail "--app <path/to/.app> is required"
    [ -d "$APP_PATH" ] || fail "--app '$APP_PATH' is not a .app directory"
    APP_PATH=$(CDPATH= cd -- "$APP_PATH" && pwd)
    [ -n "${SIMLOCK_URL:-}" ] || fail "SIMLOCK_URL is required: the simlock gateway the capture leases simulators from"
    [ -n "${SIMLOCK_TOKEN:-}" ] || fail "SIMLOCK_TOKEN is required: a simlock agent token"
    [ -d "$E2E_DIR/node_modules" ] || fail "the e2e project has no dependencies; run 'npm ci' in $E2E_DIR"
fi
mkdir -p "$OUTPUT_ROOT"
OUTPUT_ROOT=$(CDPATH= cd -- "$OUTPUT_ROOT" && pwd)

# mobile-ci's slug: lowercased, every run of non-alphanumerics one hyphen, none at either end.
device_slug() {
    printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

# A comma/space separated CLI list as a JSON array.
json_list() {
    jq -nc --arg list "$1" '$list | gsub("[,\\s]+"; " ") | split(" ") | map(select(. != ""))'
}

# plan <device> <slug> - the device's cells, as mobile-ci's capture-ios-e2e job plans them.
plan() {
    local device="$1" slug="$2" locales appearances scenes
    if [ -n "$LOCALES_OVERRIDE" ]; then
        locales=$(json_list "$LOCALES_OVERRIDE")
    else
        locales=$(jq -c --arg device "$device" '[."capture-manifest"[] | select((.platform // "ios") == "ios" and .device == $device) | .locales[] | if type == "string" then . else .id end]' "$CONFIG_PATH")
    fi
    if [ -n "$APPEARANCES_OVERRIDE" ]; then
        appearances=$(json_list "$APPEARANCES_OVERRIDE")
    else
        appearances=$(jq -c --arg device "$device" '[."capture-manifest"[] | select((.platform // "ios") == "ios" and .device == $device) | .appearances[]]' "$CONFIG_PATH")
    fi
    scenes=$(jq -c --argjson picked "$(json_list "$SCENES_OVERRIDE")" \
        '[."capture-scenes"[] | select(($picked | length) == 0 or (.name as $n | $picked | index($n)))]' "$CONFIG_PATH")
    jq -n \
        --argjson scenes "$scenes" \
        --argjson locales "$locales" \
        --argjson appearances "$appearances" \
        --argjson settle "$SETTLE_SECONDS" \
        --argjson forced "$([ -n "$SETTLE_OVERRIDE" ] && echo true || echo false)" \
        --arg root "$OUTPUT_ROOT/raw/ios/$slug" '
        [ $locales[] as $locale | $appearances[] as $appearance | $scenes[]
          | select((.platforms // ["ios"]) | index("ios"))
          | select((.locales // null) == null or (.locales | index($locale)))
          | select((.appearances // null) == null or (.appearances | index($appearance)))
          | {scene: .name, locale: $locale, appearance: $appearance,
             settleSeconds: (if $forced then $settle else (.settleSeconds // $settle) end)}
            + (if has("deepLink") then {deepLink: .deepLink} + (if has("readySelector") then {readySelector: .readySelector} else {} end) else {test: .test} end)
            + {path: "\($root)/\($locale)/\($appearance)/\(.name).png"}
        ]'
}

DEVICES=()
if [ -n "$DEVICE_FILTER" ]; then
    DEVICES=("$DEVICE_FILTER")
else
    while IFS= read -r manifest_device; do
        [ -n "$manifest_device" ] && DEVICES+=("$manifest_device")
    done < <(jq -r '."capture-manifest"[] | select((.platform // "ios") == "ios") | .device' "$CONFIG_PATH")
fi
[ "${#DEVICES[@]}" -gt 0 ] || fail "no iOS entries in $CONFIG_PATH capture-manifest"

PLAN_DIR=$(mktemp -d "${TMPDIR:-/tmp}/budgie-capture-plan.XXXXXX")
trap 'rm -rf "$PLAN_DIR"' EXIT

failures=0
for device in "${DEVICES[@]}"; do
    slug=$(device_slug "$device")
    plan_file="$PLAN_DIR/$slug.json"
    plan "$device" "$slug" > "$plan_file"
    cells=$(jq 'length' "$plan_file")
    [ "$cells" -gt 0 ] || fail "no capture cell for $device: the locales/appearances/scenes filters excluded every scene"

    if [ "$DRY_RUN" = 'true' ]; then
        echo "device: $device (slug $slug)"
        echo "  app-id: $APP_ID"
        echo "  status-bar: $STATUS_BAR_MODE"
        echo "  cells: $cells"
        jq -r --arg root "$OUTPUT_ROOT/raw/ios/" '.[] | "  \(.path | ltrimstr($root)) <- \(if .deepLink then "\(.deepLink) (settle \(.settleSeconds)s)" else "test \(.test)" end)"' "$plan_file"
        continue
    fi

    # CI clears raw/ios/<device-slug> per run so a reused output directory never republishes a stale scene.
    rm -rf "${OUTPUT_ROOT:?}/raw/ios/$slug"
    echo "capturing $cells cells on $device ($slug)"
    status=0
    (
        cd "$E2E_DIR"
        export SCREENSHOT_PLAN="$plan_file" SCREENSHOT_DEVICE="$device" SCREENSHOT_DEVICE_SLUG="$slug" \
            SCREENSHOT_STATUS_BAR="$STATUS_BAR_MODE" E2E_APP_PATH="$APP_PATH" E2E_APP_ID="$APP_ID" \
            E2E_WORKERS="$WORKERS" E2E_RETRIES="${E2E_RETRIES:-1}"
        rm -rf .e2e
        npx e2e run --config media.config.ts --target ios
    ) || status=$?

    missing=0
    while IFS= read -r path; do
        if [ ! -s "$path" ]; then
            echo "  missing: $path" >&2
            missing=$((missing + 1))
        fi
    done < <(jq -r '.[].path' "$plan_file")
    if [ "$status" -ne 0 ] || [ "$missing" -gt 0 ]; then
        echo "  $device: the capture exited $status and $missing of $cells cells are missing; see e2e/.e2e" >&2
        failures=$((failures + 1))
    else
        echo "wrote $OUTPUT_ROOT/raw/ios/$slug"
    fi
done

[ "$failures" -eq 0 ] || fail "$failures device(s) failed"

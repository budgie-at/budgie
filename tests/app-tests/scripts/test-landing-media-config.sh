#!/bin/bash
# Verifies .github/landing-media.config.json is a usable sibling of the store
# screenshot config: same mobile-ci direct-capture shape, no App Store Connect
# surface, a separate download root, scene ids that match the landing route
# slugs, and a scene set that lines up 1:1 with the compose group map.
# Runs anywhere: only jq and the two committed JSON files are needed.
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
LANDING_CONFIG="$REPO_ROOT/.github/landing-media.config.json"
STORE_CONFIG="$REPO_ROOT/.github/store-screenshots.config.json"
GROUPS_MAP="$REPO_ROOT/packages/app/fastlane/screenshots/design/web-media-groups.json"
CAPTURE_SCRIPT="$SCRIPT_DIR/capture-store-screenshots.sh"
FEATURES_DIR="$REPO_ROOT/packages/landing/src/app/[lang]/features"

if ! command -v jq >/dev/null 2>&1; then
    echo "skip test-landing-media-config: 'jq' is not installed"

    exit 0
fi

FAILURES=0

pass() {
    echo "ok   $1"
}

check() {
    local label="$1" condition="$2"
    if [ "$condition" = 'true' ]; then
        pass "$label"
    else
        echo "FAIL $label"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_equals() {
    local label="$1" actual="$2" expected="$3"
    if [ "$actual" = "$expected" ]; then
        pass "$label"
    else
        echo "FAIL $label: expected '$expected', got '$actual'"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_empty() {
    local label="$1" value="$2"
    if [ -z "$value" ]; then
        pass "$label"
    else
        echo "FAIL $label: unexpected $(printf '%s' "$value" | tr '\n' ' ')"
        FAILURES=$((FAILURES + 1))
    fi
}

for required_file in "$LANDING_CONFIG" "$STORE_CONFIG" "$GROUPS_MAP"; do
    if [ ! -f "$required_file" ]; then
        echo "FAIL missing required file: $required_file"

        exit 1
    fi
done

check 'landing config is valid JSON' "$(jq -e . "$LANDING_CONFIG" >/dev/null 2>&1 && echo true || echo false)"
check 'group map is valid JSON' "$(jq -e . "$GROUPS_MAP" >/dev/null 2>&1 && echo true || echo false)"

assert_equals 'capture-mode is direct' "$(jq -r '."capture-mode"' "$LANDING_CONFIG")" 'direct'
assert_equals 'status bar is overridden like the store set' "$(jq -r '."status-bar-override"' "$LANDING_CONFIG")" 'true'
assert_equals 'seed hook matches the store config' \
    "$(jq -r '."seed-command"' "$LANDING_CONFIG")" "$(jq -r '."seed-command"' "$STORE_CONFIG")"
assert_equals 'maestro config matches the store config' \
    "$(jq -r '."maestro-config"' "$LANDING_CONFIG")" "$(jq -r '."maestro-config"' "$STORE_CONFIG")"
assert_equals 'ios target matches the store config' \
    "$(jq -cS '."ios-target"' "$LANDING_CONFIG")" "$(jq -cS '."ios-target"' "$STORE_CONFIG")"

# screenshots-dir stays the Maestro workspace root because mobile-ci resolves
# flow-backed scenes against it in direct mode; the landing run is kept off the
# store's raw tree by screenshots-download-dir instead.
assert_equals 'screenshots-dir resolves the media flows' "$(jq -r '."screenshots-dir"' "$LANDING_CONFIG")" 'tests/app-tests'
check 'download dir differs from the store raw dir' \
    "$([ "$(jq -r '."screenshots-download-dir"' "$LANDING_CONFIG")" != "$(jq -r '."screenshots-download-dir"' "$STORE_CONFIG")" ] && echo true || echo false)"

assert_empty 'no App Store Connect keys' \
    "$(jq -r 'keys[] | select(startswith("asc-") or . == "apple-screenshot-slots" or . == "upload-command" or . == "upload-screenshots")' "$LANDING_CONFIG")"

assert_equals 'iPhone 17 Pro Max is in the manifest' \
    "$(jq -r '[."capture-manifest"[] | select(.device == "iPhone 17 Pro Max")] | length' "$LANDING_CONFIG")" '1'
assert_equals 'iPad Pro 13-inch (M4) is in the manifest' \
    "$(jq -r '[."capture-manifest"[] | select(.device == "iPad Pro 13-inch (M4)")] | length' "$LANDING_CONFIG")" '1'
assert_empty 'every manifest entry covers the 5 landing locales' \
    "$(jq -r '."capture-manifest"[] | select((.locales | sort) != ["de","en","es","fr","uk"]) | .device' "$LANDING_CONFIG")"
assert_empty 'every manifest entry covers both appearances' \
    "$(jq -r '."capture-manifest"[] | select((.appearances | sort) != ["dark","light"]) | .device' "$LANDING_CONFIG")"

assert_equals 'the prime scene is first so mobile-ci grants deep-link trust with it' \
    "$(jq -r '."capture-scenes"[0].name' "$LANDING_CONFIG")" '00-prime'
assert_equals 'the prime scene runs the shared setup flow' \
    "$(jq -r '."capture-scenes"[0].flow' "$LANDING_CONFIG")" 'flows/setup/prime-deep-links-scene.flow.yaml'
check 'the prime flow exists' "$([ -f "$REPO_ROOT/tests/app-tests/flows/setup/prime-deep-links-scene.flow.yaml" ] && echo true || echo false)"

assert_empty 'scene names are unique' \
    "$(jq -r '[."capture-scenes"[].name] | group_by(.) | map(select(length > 1) | .[0])[]' "$LANDING_CONFIG")"
assert_empty 'every scene carries exactly one of deepLink/flow' \
    "$(jq -r '."capture-scenes"[] | select((has("deepLink") and has("flow")) or ((has("deepLink") or has("flow")) | not)) | .name' "$LANDING_CONFIG")"
assert_empty 'every deep link uses the app scheme' \
    "$(jq -r '."capture-scenes"[] | select(has("deepLink")) | select(.deepLink | startswith("budgie://") | not) | .name' "$LANDING_CONFIG")"
assert_empty 'every non-prime flow lives under flows/media' \
    "$(jq -r '."capture-scenes"[] | select(has("flow")) | select(.name != "00-prime") | select(.flow | startswith("flows/media/") | not) | .name' "$LANDING_CONFIG")"
assert_empty 'no flow path escapes screenshots-dir' \
    "$(jq -r '."capture-scenes"[] | select(has("flow")) | select((.flow | startswith("/")) or (.flow | contains(".."))) | .name' "$LANDING_CONFIG")"
assert_empty 'one flow file per flow-backed scene (a flow cell emits exactly one screenshot)' \
    "$(jq -r '[."capture-scenes"[] | select(has("flow")) | .flow] | group_by(.) | map(select(length > 1) | .[0])[]' "$LANDING_CONFIG")"

# The capture runner is shared with the store set; --config plus --output is the
# whole landing runner, so no forked copy of it exists to drift.
check 'the shared capture runner accepts --config and --output' \
    "$(grep -q -- '--config) CONFIG_PATH=' "$CAPTURE_SCRIPT" && grep -q -- '--output) OUTPUT_ROOT=' "$CAPTURE_SCRIPT" && echo true || echo false)"

CONFIG_SCENES=$(jq -r '."capture-scenes"[].name | select(. != "00-prime")' "$LANDING_CONFIG" | sort)
MAP_SCENES=$(jq -r '.scenes | keys[]' "$GROUPS_MAP" | sort)
assert_empty 'every captured scene is mapped to a landing route slug' "$(comm -23 <(echo "$CONFIG_SCENES") <(echo "$MAP_SCENES"))"
assert_empty 'every mapped scene is captured' "$(comm -13 <(echo "$CONFIG_SCENES") <(echo "$MAP_SCENES"))"

assert_empty 'every mapped scene declares at least one group' \
    "$(jq -r '.scenes | to_entries[] | select((.value.groups | length) == 0) | .key' "$GROUPS_MAP")"
assert_empty 'every mapped device is iphone or ipad' \
    "$(jq -r '.scenes | to_entries[] | select(((.value.devices // ["iphone"]) - ["iphone","ipad"]) | length > 0) | .key' "$GROUPS_MAP")"
assert_empty 'every declared budget class is hero or feature' \
    "$(jq -r '.scenes | to_entries[] | select((.value.budget // "feature") | IN("hero","feature") | not) | .key' "$GROUPS_MAP")"

# Every group slug must be a real landing route: a feature page directory, the
# home page, the features hub, or one of the 5 pillar hubs.
NON_FEATURE_GROUPS='home features ai-features offline-first open-source privacy security'
UNKNOWN_GROUPS=''
while IFS= read -r group; do
    [ -n "$group" ] || continue
    if [ -d "$FEATURES_DIR/$group" ]; then
        continue
    fi
    if printf '%s\n' $NON_FEATURE_GROUPS | grep -qFx "$group"; then
        continue
    fi
    UNKNOWN_GROUPS="$UNKNOWN_GROUPS $group"
done <<< "$(jq -r '[.scenes[].groups[]] | unique[]' "$GROUPS_MAP")"
assert_empty 'every group slug is a real landing route' "$UNKNOWN_GROUPS"

# A scene owned by a feature page must publish into that page's own slug, which
# is what lets a page resolve its media from its route slug with no alias table.
assert_empty 'each feature scene publishes into its own route slug' \
    "$(jq -r '.scenes | to_entries[]
        | .key as $scene
        | ($scene | sub("-[0-9]+$"; "")) as $owner
        | select($owner != "home-hero")
        | select(.value.groups | index($owner) | not)
        | $scene' "$GROUPS_MAP")"

if [ "$FAILURES" -eq 0 ]; then
    echo "test-landing-media-config: all checks passed"

    exit 0
fi

echo "test-landing-media-config: $FAILURES check(s) failed" >&2

exit 1

#!/bin/bash
# Self-test for the landing media capture config's scene and clip-flow conventions.
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo 'skip  jq not on PATH'; exit 0; }

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
CONFIG="$REPO_ROOT/.github/landing-media.config.json"
FAILURES=0

fail() {
    echo "FAIL $1"
    FAILURES=$((FAILURES + 1))
}
ok() { echo "ok   $1"; }

jq empty "$CONFIG" 2>/dev/null && ok 'config is valid JSON' || fail 'config is not valid JSON'

MODE=$(jq -r '."capture-mode"' "$CONFIG")
[ "$MODE" = 'direct' ] && ok 'capture-mode is direct' || fail "capture-mode is '$MODE', expected direct"

SCREENSHOTS_DIR="$REPO_ROOT/$(jq -r '."screenshots-dir"' "$CONFIG")"
NAMES=$(jq -r '."capture-scenes"[].name' "$CONFIG")

DUPES=$(printf '%s\n' "$NAMES" | sort | uniq -d)
[ -z "$DUPES" ] && ok 'scene names are unique' || fail "duplicate scene names: $DUPES"

BAD_CASE=$(printf '%s\n' "$NAMES" | grep -Ev '^[a-z0-9]+(-[a-z0-9]+)*$' || true)
[ -z "$BAD_CASE" ] && ok 'scene names are kebab-case' || fail "non-kebab-case scene names: $BAD_CASE"

BAD_KEYS=$(jq -r '."capture-scenes"[] | select((([has("deepLink"), has("flow")] | map(select(.))) | length) != 1) | .name' "$CONFIG")
[ -z "$BAD_KEYS" ] && ok 'every scene declares exactly one of deepLink/flow' || fail "scenes without exactly one of deepLink/flow: $BAD_KEYS"

MISSING_FLOWS=0
while IFS=$'\t' read -r name flow; do
    [ -n "$name" ] || continue
    [ -f "$SCREENSHOTS_DIR/$flow" ] || { fail "scene '$name' flow '$flow' does not exist under screenshots-dir"; MISSING_FLOWS=$((MISSING_FLOWS + 1)); }
done < <(jq -r '."capture-scenes"[] | select(has("flow")) | .name + "\t" + .flow' "$CONFIG")
[ "$MISSING_FLOWS" -eq 0 ] && ok 'every flow scene resolves to a file under screenshots-dir'

MEDIA_DIR="$SCREENSHOTS_DIR/flows/media"
for flow_file in "$MEDIA_DIR"/*.flow.yaml; do
    [ -e "$flow_file" ] || continue
    base=$(basename "$flow_file")
    rel="flows/media/$base"
    shots=$(grep -n '^- takeScreenshot:' "$flow_file" || true)
    starts=$(grep -n '^- startRecording:' "$flow_file" || true)
    stops=$(grep -c '^- stopRecording$' "$flow_file" || true)
    shot_count=$(printf '%s\n' "$shots" | grep -c . || true)
    start_count=$(printf '%s\n' "$starts" | grep -c . || true)
    if [ "$shot_count" -ne 1 ] || [ "$start_count" -ne "$stops" ] || [ "$start_count" -gt 1 ]; then
        fail "$base does not have exactly one takeScreenshot and at most one startRecording/stopRecording pair"
        continue
    fi
    if [ "$start_count" -eq 1 ]; then
        shot_line=$(printf '%s\n' "$shots" | cut -d: -f1)
        start_line=$(printf '%s\n' "$starts" | cut -d: -f1)
        [ "$shot_line" -lt "$start_line" ] && ok "$base takes its poster before it starts recording" || fail "$base's takeScreenshot is not before its startRecording"
    fi

    referencing=$(jq -r --arg f "$rel" '[."capture-scenes"[] | select(.flow == $f) | .name]' "$CONFIG")
    ref_count=$(printf '%s' "$referencing" | jq 'length')
    if [ "$ref_count" -ne 1 ]; then
        fail "$rel is referenced by $ref_count scenes, expected exactly 1"
        continue
    fi
    ref_name=$(printf '%s' "$referencing" | jq -r '.[0]')
    if [ "$start_count" -eq 1 ]; then
        printf '%s\n' "$ref_name" | grep -qE -- '-clip-[0-9]+$' && ok "$ref_name follows the *-clip-<n> naming convention" || fail "$ref_name does not match the *-clip-<n> naming convention"
    else
        printf '%s\n' "$ref_name" | grep -qE -- '-[0-9]+$' && ! printf '%s\n' "$ref_name" | grep -qE -- '-clip-[0-9]+$' &&
            ok "$ref_name follows the still <slug>-<n> naming convention" ||
            fail "$ref_name does not match the still <slug>-<n> naming convention"
    fi
done

if [ "$FAILURES" -gt 0 ]; then
    echo "$FAILURES assertion(s) failed"
    exit 1
fi
echo 'All test-landing-media-config.sh assertions passed'

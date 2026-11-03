#!/bin/bash
# Self-test for the landing media capture config's scene conventions: every scene a deep link
# or an e2e scene (e2e/support/media/scenes.ts), stills named <slug>-<n>.
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

SCENES_TS="$REPO_ROOT/e2e/support/media/scenes.ts"
NAMES=$(jq -r '."capture-scenes"[].name' "$CONFIG")

DUPES=$(printf '%s\n' "$NAMES" | sort | uniq -d)
[ -z "$DUPES" ] && ok 'scene names are unique' || fail "duplicate scene names: $DUPES"

BAD_CASE=$(printf '%s\n' "$NAMES" | grep -Ev '^[a-z0-9]+(-[a-z0-9]+)*$' || true)
[ -z "$BAD_CASE" ] && ok 'scene names are kebab-case' || fail "non-kebab-case scene names: $BAD_CASE"

BAD_KEYS=$(jq -r '."capture-scenes"[] | select((([has("deepLink"), has("test")] | map(select(.))) | length) != 1 or has("flow")) | .name' "$CONFIG")
[ -z "$BAD_KEYS" ] && ok 'every scene declares exactly one of deepLink/test' || fail "scenes without exactly one of deepLink/test: $BAD_KEYS"

MISSING_TESTS=0
while IFS=$'\t' read -r name test_name; do
    [ -n "$name" ] || continue
    grep -qE "^    '?${test_name}'?: " "$SCENES_TS" || { fail "scene '$name' test '$test_name' is not a SCENES entry in e2e/support/media/scenes.ts"; MISSING_TESTS=$((MISSING_TESTS + 1)); }
done < <(jq -r '."capture-scenes"[] | select(has("test")) | .name + "\t" + .test' "$CONFIG")
[ "$MISSING_TESTS" -eq 0 ] && ok 'every test scene names a SCENES entry'

while IFS= read -r name; do
    [ -n "$name" ] || continue
    case "$name" in
        app-store-preview) ok "$name is the recorded preview clip" ;;
        *-clip-[0-9]*) fail "$name is a clip, not a still" ;;
        *-[0-9]*) ok "$name follows the still <slug>-<n> naming convention" ;;
        *) fail "$name does not match the still <slug>-<n> naming convention" ;;
    esac
done < <(jq -r '."capture-scenes"[] | select(has("test")) | .name' "$CONFIG")

if [ "$FAILURES" -gt 0 ]; then
    echo "$FAILURES assertion(s) failed"
    exit 1
fi
echo 'All test-landing-media-config.sh assertions passed'

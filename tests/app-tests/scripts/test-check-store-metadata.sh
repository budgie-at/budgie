#!/bin/bash
# Verifies check-store-metadata.sh passes on main's metadata tree and fails on an over-budget subtitle and a spaced keyword list.
set -euo pipefail
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
TARGET="$REPO_ROOT/.github/scripts/check-store-metadata.sh"

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
FAILURES=0

assert_pass() {
    local label="$1"
    if bash "$TARGET" >"$WORK_DIR/pass.log" 2>&1; then
        echo "ok   $label"
    else
        echo "FAIL $label:"
        cat "$WORK_DIR/pass.log"
        FAILURES=$((FAILURES + 1))
    fi
}

assert_fail() {
    local label="$1"
    if bash "$TARGET" >"$WORK_DIR/fail.log" 2>&1; then
        echo "FAIL $label: expected the gate to fail but it passed"
        FAILURES=$((FAILURES + 1))
    else
        echo "ok   $label"
    fi
}

REPO_COPY="$WORK_DIR/repo"
mkdir -p "$REPO_COPY/.github/scripts" "$REPO_COPY/packages/app/fastlane"
cp "$TARGET" "$REPO_COPY/.github/scripts/check-store-metadata.sh"
cp -R "$REPO_ROOT/packages/app/fastlane/metadata" "$REPO_COPY/packages/app/fastlane/metadata"

pushd "$REPO_COPY" >/dev/null
TARGET="$REPO_COPY/.github/scripts/check-store-metadata.sh"
assert_pass "gate passes on main's metadata tree"

printf '%s' "$(head -c 40 </dev/zero | tr '\0' 'x')" >"$REPO_COPY/packages/app/fastlane/metadata/ios/en-US/subtitle.txt"
assert_fail "gate fails on an over-budget subtitle.txt"
cp "$REPO_ROOT/packages/app/fastlane/metadata/ios/en-US/subtitle.txt" "$REPO_COPY/packages/app/fastlane/metadata/ios/en-US/subtitle.txt"

printf 'money, finance, spending' >"$REPO_COPY/packages/app/fastlane/metadata/ios/en-US/keywords.txt"
assert_fail "gate fails on a keyword with a space after a comma"
popd >/dev/null

if [ "$FAILURES" -eq 0 ]; then
    echo "test-check-store-metadata: all checks passed"
    exit 0
fi
echo "test-check-store-metadata: $FAILURES check(s) failed" >&2
exit 1

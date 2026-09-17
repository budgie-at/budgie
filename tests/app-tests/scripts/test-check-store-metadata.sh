#!/bin/bash
# Verifies check-store-metadata.sh passes on the committed metadata tree and fails on an over-budget field and a spaced keyword list.
set -euo pipefail

REPO_ROOT=$(cd -- "$(dirname -- "$0")/../../.." && pwd)
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

mkdir -p "$WORK_DIR/.github/scripts" "$WORK_DIR/packages/app/fastlane"
cp "$REPO_ROOT/.github/scripts/check-store-metadata.sh" "$WORK_DIR/.github/scripts/"
cp -R "$REPO_ROOT/packages/app/fastlane/metadata" "$WORK_DIR/packages/app/fastlane/metadata"
GATE="$WORK_DIR/.github/scripts/check-store-metadata.sh"
IOS_EN="$WORK_DIR/packages/app/fastlane/metadata/ios/en-US"

if ! bash "$GATE" >/dev/null; then
    echo 'FAIL: gate rejected the committed metadata tree' >&2
    exit 1
fi

printf 'x%.0s' {1..40} >"$IOS_EN/subtitle.txt"
if bash "$GATE" >/dev/null 2>&1; then
    echo 'FAIL: gate accepted a 40-character subtitle.txt' >&2
    exit 1
fi

cp "$REPO_ROOT/packages/app/fastlane/metadata/ios/en-US/subtitle.txt" "$IOS_EN/subtitle.txt"
printf 'money, finance' >"$IOS_EN/keywords.txt"
if bash "$GATE" >/dev/null 2>&1; then
    echo 'FAIL: gate accepted a keywords.txt with a space after a comma' >&2
    exit 1
fi

echo 'PASS: check-store-metadata'

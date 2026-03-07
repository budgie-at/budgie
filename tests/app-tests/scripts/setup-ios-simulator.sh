#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
FIXTURE_PATH="$SCRIPT_DIR/../fixtures/maestro-e2e-contact.vcf"

xcrun simctl addmedia booted "$FIXTURE_PATH" >/dev/null 2>&1 || true

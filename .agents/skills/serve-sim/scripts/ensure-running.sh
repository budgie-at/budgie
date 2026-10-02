#!/usr/bin/env bash
# Ensure a serve-sim helper is running for the booted simulator.
# Idempotent: if one is already running, prints its URL JSON and exits 0.
# Otherwise starts a detached one and prints the spawn JSON.
# Usage: ensure-running.sh [device-name-or-udid]

set -u

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../../.." && pwd)
# shellcheck disable=SC1091
. "$REPO_ROOT/tests/app-tests/scripts/mobile-ci-slim-simulator.sh"

if [[ -z "$(booted_simulator_udids)" ]]; then
  echo "ensure-running: no booted simulator to attach a helper to. Boot one with Xcode > Simulator or 'xcrun simctl boot <UDID>', then re-run so it is slimmed first." >&2
  exit 1
fi

if ! slim_booted_simulators; then
  echo "ensure-running: every simulator must run slim before serve-sim drives it." >&2
  exit 1
fi

DEVICE="${1:-}"

# If a helper is already running for any device, return it
EXISTING="$(npx --yes serve-sim --list -q 2>/dev/null || echo '[]')"
if [[ "$EXISTING" != "[]" && -n "$EXISTING" ]]; then
  if [[ -n "$DEVICE" ]]; then
    MATCH="$(echo "$EXISTING" | node -e "
      const arr = JSON.parse(require('fs').readFileSync(0, 'utf8'));
      const d = process.argv[1].toLowerCase();
      const m = arr.find(x => (x.device || '').toLowerCase().includes(d) || x.udid === d);
      if (m) console.log(JSON.stringify(m));
    " "$DEVICE")"
    if [[ -n "$MATCH" ]]; then
      echo "$MATCH"
      exit 0
    fi
  else
    # No specific device requested — return the first running one
    echo "$EXISTING" | node -e "
      const arr = JSON.parse(require('fs').readFileSync(0, 'utf8'));
      if (arr[0]) console.log(JSON.stringify(arr[0]));
    "
    exit 0
  fi
fi

# Start a new detached helper
if [[ -n "$DEVICE" ]]; then
  npx --yes serve-sim --detach -q "$DEVICE"
else
  npx --yes serve-sim --detach -q
fi

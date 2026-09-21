#!/usr/bin/env bash
# Verify the host satisfies serve-sim's prerequisites.
# Exits 0 if everything is OK, 1 with a human message otherwise.
# Intended to be sourced by an agent before any other serve-sim command.

set -u

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../../.." && pwd)
# shellcheck disable=SC1091
. "$REPO_ROOT/tests/app-tests/scripts/mobile-ci-slim-simulator.sh"

fail() {
  echo "serve-sim prereq check failed: $1" >&2
  exit 1
}

# macOS host
if [[ "$(uname -s)" != "Darwin" ]]; then
  fail "serve-sim requires macOS. Detected: $(uname -s)."
fi

# Xcode CLI tools (simctl)
if ! command -v xcrun >/dev/null 2>&1; then
  fail "xcrun not found. Install Xcode command line tools: xcode-select --install"
fi
if ! xcrun --find simctl >/dev/null 2>&1; then
  fail "simctl not found via xcrun. Install Xcode command line tools."
fi

# Node 18+
if ! command -v node >/dev/null 2>&1; then
  fail "node not found. Install Node.js 18 or newer (https://nodejs.org)."
fi
NODE_MAJOR="$(node -e 'console.log(process.versions.node.split(".")[0])')"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  fail "node $NODE_MAJOR detected. serve-sim requires Node.js 18+."
fi

# macOS 14+ is optional (camera-only), so warn rather than fail
MACOS_MAJOR="$(sw_vers -productVersion | cut -d. -f1)"
if [[ "$MACOS_MAJOR" -lt 14 ]]; then
  echo "warning: macOS $(sw_vers -productVersion) detected. The 'camera' subcommand requires macOS 14+." >&2
fi

if ! command -v simslim >/dev/null 2>&1; then
  fail "simslim not found. Install it with: brew install mobai-app/tap/simslim"
fi

# A booted simulator is required for most commands, and it must run slim
if [[ -z "$(booted_simulator_udids)" ]]; then
  echo "warning: no booted simulator detected. Boot one with Xcode > Simulator or 'xcrun simctl boot <UDID>', then re-run this check to slim it." >&2
elif ! slim_booted_simulators; then
  fail "simslim could not slim every booted simulator."
fi

echo "serve-sim prereqs OK."
exit 0

#!/bin/bash
# Source mobile-ci's shared simslim helper at the pinned ref (v4.16.0), cached per ref.

MOBILE_CI_REF="${MOBILE_CI_REF:-d5fdd5f7dc5e4cb6b352f310a2fa494638a9795f}"
SIMSLIM_PROFILE_REF="${SIMSLIM_PROFILE_REF:-$MOBILE_CI_REF}"
export SIMSLIM_PROFILE_REF

MOBILE_CI_SLIM_HELPER="${MOBILE_CI_SLIM_HELPER:-${TMPDIR:-/tmp}/mobile-ci-slim-simulator-${MOBILE_CI_REF}.sh}"

if [ ! -s "$MOBILE_CI_SLIM_HELPER" ] && ! curl -fsSL \
    "https://raw.githubusercontent.com/rnw-community/mobile-ci/${MOBILE_CI_REF}/scripts/slim-simulator.sh" \
    -o "$MOBILE_CI_SLIM_HELPER"; then
    rm -f "$MOBILE_CI_SLIM_HELPER"
    echo "Could not fetch mobile-ci ${MOBILE_CI_REF} scripts/slim-simulator.sh, and every simulator must run slim. Restore network access, or point MOBILE_CI_SLIM_HELPER at a cached copy." >&2
    exit 1
fi

# shellcheck disable=SC1090
. "$MOBILE_CI_SLIM_HELPER"

#!/bin/bash
# Source mobile-ci's shared simslim helper at the pinned ref (v4.10.2), cached per ref.

MOBILE_CI_REF="${MOBILE_CI_REF:-d8b7f0c45ff83974aa9e4e8e14ba6dbc336f8525}"
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

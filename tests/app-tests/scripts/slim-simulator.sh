#!/bin/bash
# Slim a freshly booted simulator against the same profile CI verifies, so a local
# run reproduces the CI simulator. See AGENTS.md "Simulator Dev Testing".

SIMSLIM_PROFILE_PATH="${SIMSLIM_PROFILE_PATH:-$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/simslim.ci.json}"
export SIMSLIM_PROFILE_PATH

slim_simulator() {
    local udid="$1"

    if ! command -v simslim >/dev/null 2>&1; then
        echo "simslim not found; every simulator this repo boots must run slim. Install it with: brew install mobai-app/tap/simslim" >&2
        return 1
    fi

    if simslim verify "$udid" --profile "$SIMSLIM_PROFILE_PATH" >/dev/null 2>&1; then
        return 0
    fi

    simslim on "$udid" --no-reboot --profile "$SIMSLIM_PROFILE_PATH"
}

booted_simulator_udids() {
    xcrun simctl list devices booted -j 2>/dev/null | node -e '
        let input = "";
        process.stdin.on("data", chunk => input += chunk);
        process.stdin.on("end", () => {
            const inventory = JSON.parse(input || "{}").devices || {};
            process.stdout.write(Object.values(inventory).flat().map(device => device.udid).join("\n"));
        });
    '
}

slim_booted_simulators() {
    local udid

    while IFS= read -r udid; do
        if [ -n "$udid" ]; then
            slim_simulator "$udid" || return 1
        fi
    done <<< "$(booted_simulator_udids)"
}

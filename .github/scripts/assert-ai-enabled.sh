#!/usr/bin/env bash
# Fails the job when the resolved Expo config would ship AI disabled to users.
set -euo pipefail

cd packages/app
if [ -n "${EAS_BUILD_PROFILE:-}" ]; then
  PROFILE_ENV=$(node -e '
    const profiles = JSON.parse(require("fs").readFileSync("eas.json", "utf8")).build;
    const chain = [];
    for (let name = process.argv[1]; name; name = profiles[name].extends) chain.unshift(profiles[name]);
    const env = Object.assign({}, ...chain.map(profile => profile.env ?? {}));
    process.stdout.write(Object.entries(env).map(([key, value]) => `${key}=${value}`).join("\n"));
  ' "$EAS_BUILD_PROFILE")
  echo "eas.json build.$EAS_BUILD_PROFILE env:"
  echo "$PROFILE_ENV"
  while IFS= read -r line; do
    [ -n "$line" ] && export "$line"
  done <<<"$PROFILE_ENV"
fi
CONFIG_JSON=$(npx expo config --json)
AI_ENABLED=$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync(0,'utf8')).extra.aiEnabled))" <<<"$CONFIG_JSON")

echo "Resolved extra.aiEnabled=$AI_ENABLED (APP_VARIANT=${APP_VARIANT:-<unset>} EXPO_PUBLIC_AI_DISABLE=${EXPO_PUBLIC_AI_DISABLE:-<unset>} EAS_BUILD_PROFILE=${EAS_BUILD_PROFILE:-<unset>})"

if [ "$AI_ENABLED" != "true" ]; then
  echo "::error::AI is disabled in this build artifact (extra.aiEnabled=$AI_ENABLED). APP_VARIANT=${APP_VARIANT:-<unset>} EXPO_PUBLIC_AI_DISABLE=${EXPO_PUBLIC_AI_DISABLE:-<unset>} EAS_BUILD_PROFILE=${EAS_BUILD_PROFILE:-<unset>}"
  exit 1
fi

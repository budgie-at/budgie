#!/usr/bin/env bash
# Fails the job when the resolved Expo config would ship AI disabled to users.
set -euo pipefail

cd packages/app
CONFIG_JSON=$(npx expo config --json)
AI_ENABLED=$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync(0,'utf8')).extra.aiEnabled))" <<<"$CONFIG_JSON")

echo "Resolved extra.aiEnabled=$AI_ENABLED (APP_VARIANT=${APP_VARIANT:-<unset>} EXPO_PUBLIC_AI_DISABLE=${EXPO_PUBLIC_AI_DISABLE:-<unset>})"

if [ "$AI_ENABLED" != "true" ]; then
  echo "::error::AI is disabled in this build artifact (extra.aiEnabled=$AI_ENABLED). APP_VARIANT=${APP_VARIANT:-<unset>} EXPO_PUBLIC_AI_DISABLE=${EXPO_PUBLIC_AI_DISABLE:-<unset>}"
  exit 1
fi

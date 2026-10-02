#!/usr/bin/env bash
set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
PACKAGE="${PACKAGE:-com.vitaliiyehorov.budgie.preview}"
RUNS="${1:-5}"
ADB="$ANDROID_HOME/platform-tools/adb"

COMPONENT=$("$ADB" shell cmd package resolve-activity --brief -c android.intent.category.LAUNCHER "$PACKAGE" | tail -1 | tr -d '\r')
if [ -z "$COMPONENT" ]; then
    echo "Could not resolve launcher activity for $PACKAGE (is it installed?)" >&2
    exit 1
fi
echo "package=$PACKAGE activity=$COMPONENT runs=$RUNS"

TIMES=()
for i in $(seq 1 "$RUNS"); do
    "$ADB" shell am force-stop "$PACKAGE"
    sleep 2
    OUTPUT=$("$ADB" shell am start -W -n "$COMPONENT")
    TIME=$(echo "$OUTPUT" | grep -o 'TotalTime: [0-9]*' | grep -o '[0-9]*')
    TIMES+=("$TIME")
    echo "run $i: ${TIME}ms"
done

VERSION=$("$ADB" shell dumpsys package "$PACKAGE" | grep -m1 versionName | tr -d '\r' | xargs)

echo ""
echo "runs: ${TIMES[*]}"
echo "median: $(printf '%s\n' "${TIMES[@]}" | sort -n | awk '{a[NR]=$1} END {print (NR % 2) ? a[int(NR/2)+1] : (a[NR/2]+a[NR/2+1])/2}')ms"
echo "$VERSION"

#!/usr/bin/env bash
# Cold-start duration on a booted iOS Simulator for an already-installed app (default com.vitalyiegorov.budgie.preview, build/install out of scope): per run it terminates the app, sleeps 2s, times `xcrun simctl launch`, then parses `log show` for the SpringBoard `Running <bundle> for <pid>` event and the app process' first log event; the reported duration is that log-derived launch-to-first-app-event span, or, when the marker pair is absent, the `simctl launch` wall clock (process spawn only, labelled as fallback).
set -euo pipefail

BUNDLE="${1:-${BUNDLE:-com.vitalyiegorov.budgie.preview}}"
RUNS="${2:-${RUNS:-5}}"

UDID=$(xcrun simctl list devices booted | sed -n 's/.*(\([A-F0-9-]\{36\}\)).*/\1/p' | head -1)
if [ -z "$UDID" ]; then
    echo "No booted simulator found (boot a device with $BUNDLE installed)" >&2
    exit 1
fi
DEVICE=$(xcrun simctl list devices booted | sed -n 's/^[[:space:]]*\(.*\) ([A-F0-9-]\{36\}).*/\1/p' | head -1)
echo "device=$DEVICE udid=$UDID bundle=$BUNDLE runs=$RUNS"

TIMES=()
SOURCES=()
for i in $(seq 1 "$RUNS"); do
    xcrun simctl terminate "$UDID" "$BUNDLE" 2>/dev/null || true
    sleep 2
    T0=$(python3 -c 'import time; print(time.time())')
    LAUNCH=$(xcrun simctl launch "$UDID" "$BUNDLE")
    T1=$(python3 -c 'import time; print(time.time())')
    PID=$(printf '%s\n' "$LAUNCH" | grep -oE '[0-9]+$' | head -1)
    WALL=$(python3 -c "print(round(($T1 - $T0) * 1000))")
    LOGJSON=$(xcrun simctl spawn "$UDID" log show --last 60s --predicate "eventMessage CONTAINS \"$BUNDLE\"" --style json 2>/dev/null || true)
    RESULT=$(printf '%s' "$LOGJSON" | LOG_BUNDLE="$BUNDLE" LOG_PID="$PID" LOG_WALL="$WALL" python3 -c '
import json, os, re, sys
from datetime import datetime

bundle = os.environ["LOG_BUNDLE"]
pid = os.environ["LOG_PID"]
wall = int(os.environ["LOG_WALL"])
events = []
raw = sys.stdin.read()
try:
    data = json.loads(raw)
    events = data if isinstance(data, list) else data.get("log", [])
except Exception:
    for line in raw.splitlines():
        if not line.strip():
            continue
        try:
            item = json.loads(line)
            item = item.get("log", item) if isinstance(item, dict) else item
            events.extend(item if isinstance(item, list) else [item])
        except Exception:
            continue
stamps = {}
launch = re.compile(r"Running " + re.escape(bundle) + r" for " + re.escape(pid) + r"(?!\d)")
start = None
end = None
try:
    for event in events:
        stamps[id(event)] = datetime.strptime(event["timestamp"][:26], "%Y-%m-%d %H:%M:%S.%f")
    for event in events:
        stamp = stamps[id(event)]
        if start is None and launch.search(event.get("eventMessage", "")):
            start = stamp
        elif start is not None and end is None and event.get("processID") == int(pid):
            end = stamp
except Exception:
    start = None
if start is not None and end is not None:
    print(str(round((end - start).total_seconds() * 1000)) + "|log")
else:
    print(str(wall) + "|wall")
')
    TIME="${RESULT%%|*}"
    SOURCE="${RESULT##*|}"
    TIMES+=("$TIME")
    SOURCES+=("$SOURCE")
    if [ "$SOURCE" = "log" ]; then
        echo "run $i: ${TIME}ms (log: SpringBoard launch -> first app-process event)"
    else
        echo "run $i: ${TIME}ms (wall-clock fallback: simctl launch process spawn, no log marker found)"
    fi
done

echo ""
echo "runs: ${TIMES[*]}"
echo "median: $(printf '%s\n' "${TIMES[@]}" | sort -n | awk '{a[NR]=$1} END {print (NR % 2) ? a[int(NR/2)+1] : (a[NR/2]+a[NR/2+1])/2}')ms"
if printf '%s\n' "${SOURCES[@]}" | grep -q '^wall$'; then
    echo "note: some runs used the wall-clock fallback (simctl launch process spawn only)"
fi

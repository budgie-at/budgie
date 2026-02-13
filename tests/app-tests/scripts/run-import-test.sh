#!/bin/bash
set -e

TEST_NUM=$1
APP_ID=${APP_ID:-com.vitalyiegorov.budgie}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FLOWS_DIR="$SCRIPT_DIR/../flows/rules"
FIXTURES_DIR="$SCRIPT_DIR/../fixtures"

if [ -z "$TEST_NUM" ]; then
  echo "Usage: ./run-import-test.sh <test-number>"
  echo "Example: ./run-import-test.sh 16"
  exit 1
fi

case $TEST_NUM in
  16)
    CSV_FILE="test16-rules-import.csv"
    FLOW_FILE="16.rules-apply-during-import.flow.yaml"
    ;;
  *)
    echo "Unknown test number: $TEST_NUM (supported: 16)"
    exit 1
    ;;
esac

FLOW_PATH="$FLOWS_DIR/$FLOW_FILE"
CSV_PATH="$FIXTURES_DIR/$CSV_FILE"

if [ ! -f "$FLOW_PATH" ]; then
  echo "Error: Flow file not found: $FLOW_PATH"
  exit 1
fi

if [ ! -f "$CSV_PATH" ]; then
  echo "Error: CSV file not found: $CSV_PATH"
  exit 1
fi

echo "=== Running Import Test $TEST_NUM ==="

UDID=$(xcrun simctl list devices booted -j | python3 -c "import sys,json; devices=json.load(sys.stdin)['devices']; print(next((d['udid'] for devs in devices.values() for d in devs if d.get('state')=='Booted'), ''))")

if [ -z "$UDID" ]; then
  echo "Error: No booted simulator found"
  exit 1
fi

echo "Simulator: $UDID"
echo "Copying $CSV_FILE to simulator..."

SIM_DATA_PATH="$HOME/Library/Developer/CoreSimulator/Devices/$UDID/data"

# Find the File Provider Storage directory used by Files app (contains existing CSV files)
FILE_PROVIDER_PATH=$(find "$SIM_DATA_PATH/Containers/Shared/AppGroup" -name "File Provider Storage" -type d 2>/dev/null | while read dir; do
  if ls "$dir"/*.csv 2>/dev/null | head -1 > /dev/null; then
    echo "$dir"
    break
  fi
done)

# Fallback to first File Provider Storage if no CSV files found
if [ -z "$FILE_PROVIDER_PATH" ]; then
  FILE_PROVIDER_PATH=$(find "$SIM_DATA_PATH/Containers/Shared/AppGroup" -name "File Provider Storage" -type d 2>/dev/null | head -1)
fi

if [ -n "$FILE_PROVIDER_PATH" ]; then
  cp "$CSV_PATH" "$FILE_PROVIDER_PATH/$CSV_FILE"
  echo "Copied to File Provider Storage: $FILE_PROVIDER_PATH/$CSV_FILE"
else
  echo "Warning: Could not find File Provider Storage directory"
fi

sleep 1

echo "Running test: $FLOW_FILE"
maestro test -e APP_ID=$APP_ID -e CSV_FILENAME=$CSV_FILE "$FLOW_PATH"

echo "=== Test $TEST_NUM Complete ==="

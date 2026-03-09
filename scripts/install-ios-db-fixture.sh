#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    echo "Usage: $0 <fixture-path> [target-filename]" >&2
    exit 1
fi

FIXTURE_PATH="$1"
TARGET_NAME="${2:-$(basename "$FIXTURE_PATH")}"

if [ ! -f "$FIXTURE_PATH" ]; then
    echo "Fixture not found: $FIXTURE_PATH" >&2
    exit 1
fi

BOOTED_UDID="$(
    xcrun simctl list devices booted |
        sed -n 's/.*(\([A-F0-9-]\{36\}\)) (Booted).*/\1/p' |
        head -n 1
)"

if [ -z "$BOOTED_UDID" ]; then
    echo "No booted iOS simulator found." >&2
    exit 1
fi

APP_GROUP_ROOT="$HOME/Library/Developer/CoreSimulator/Devices/$BOOTED_UDID/data/Containers/Shared/AppGroup"

if [ ! -d "$APP_GROUP_ROOT" ]; then
    echo "Simulator AppGroup root not found: $APP_GROUP_ROOT" >&2
    exit 1
fi

find_provider_dirs() {
    find "$APP_GROUP_ROOT" -type d -name 'File Provider Storage' | sort -u
}

initialize_file_provider_dirs() {
    xcrun simctl launch "$BOOTED_UDID" com.apple.DocumentsApp >/dev/null 2>&1 || true
    sleep 3

    if find_provider_dirs | grep -q .; then
        return 0
    fi

    CANDIDATE_ROOTS="$(
        find "$APP_GROUP_ROOT" -mindepth 1 -maxdepth 1 -type d \
            \( -exec test -d '{}/com.apple.DocumentsApp' ';' -o -exec test -d '{}/Documents' ';' \) \
            | sort -u
    )"

    if [ -z "$CANDIDATE_ROOTS" ]; then
        CANDIDATE_ROOTS="$(find "$APP_GROUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort -u)"
    fi

    if [ -z "$CANDIDATE_ROOTS" ]; then
        echo "No AppGroup containers found under $APP_GROUP_ROOT" >&2
        return 1
    fi

    while IFS= read -r candidate_root; do
        [ -n "$candidate_root" ] || continue
        mkdir -p "$candidate_root/File Provider Storage"
    done <<EOF
$CANDIDATE_ROOTS
EOF
}

if ! find_provider_dirs | grep -q .; then
    initialize_file_provider_dirs
fi

FOUND=0

while IFS= read -r provider_dir; do
    [ -n "$provider_dir" ] || continue
    cp "$FIXTURE_PATH" "$provider_dir/$TARGET_NAME"
    echo "Installed $TARGET_NAME into $provider_dir"
    FOUND=1
done <<EOF
$(find_provider_dirs)
EOF

if [ "$FOUND" -eq 0 ]; then
    echo "No File Provider Storage directories found under $APP_GROUP_ROOT" >&2
    exit 1
fi

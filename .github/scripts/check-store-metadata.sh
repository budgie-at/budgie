#!/usr/bin/env bash
# Fast PR mirror of the Fastfile's verify_store_tree/verify_field_budgets gates; the Fastfile remains the release-time authority.
set -euo pipefail

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
IOS_METADATA_PATH="$REPO_ROOT/packages/app/fastlane/metadata/ios"
ANDROID_METADATA_PATH="$REPO_ROOT/packages/app/fastlane/metadata/android"
LOCALES="en-US fr-FR uk de-DE es-ES"
IOS_FIELD_BUDGETS="name.txt:30 subtitle.txt:30 keywords.txt:100 promotional_text.txt:170 description.txt:4000 release_notes.txt:4000"
ANDROID_FIELD_BUDGETS="title.txt:30 short_description.txt:80 full_description.txt:4000 changelogs/default.txt:500"
FAILURES=0

fail() {
    echo "FAIL $1" >&2
    FAILURES=$((FAILURES + 1))
}

check_field_budgets() {
    local label="$1" base_path="$2" budgets="$3" locale field_budget relative_path limit field_path content length
    for locale in $LOCALES; do
        for field_budget in $budgets; do
            relative_path="${field_budget%%:*}"
            limit="${field_budget##*:}"
            field_path="$base_path/$locale/$relative_path"
            if [ ! -f "$field_path" ]; then
                fail "$label $locale/$relative_path is missing at $field_path"
                continue
            fi
            content=$(cat "$field_path")
            length=$(printf '%s' "$content" | wc -m | tr -d ' ')
            if [ "$length" -gt "$limit" ]; then
                fail "$label $locale/$relative_path is $length characters, over the $limit budget"
            fi
            if [ "$relative_path" = "keywords.txt" ] && printf '%s' "$content" | grep -q ', '; then
                fail "$label $locale/$relative_path has a space after a comma"
            fi
        done
    done
}

check_field_budgets "iOS metadata" "$IOS_METADATA_PATH" "$IOS_FIELD_BUDGETS"
check_field_budgets "Android metadata" "$ANDROID_METADATA_PATH" "$ANDROID_FIELD_BUDGETS"

COPYRIGHT_PATH="$IOS_METADATA_PATH/copyright.txt"
CURRENT_YEAR=$(date +%Y)
if [ ! -f "$COPYRIGHT_PATH" ]; then
    fail "iOS metadata copyright.txt is missing at $COPYRIGHT_PATH"
elif ! grep -q "$CURRENT_YEAR" "$COPYRIGHT_PATH"; then
    fail "iOS metadata copyright.txt does not carry $CURRENT_YEAR: $(cat "$COPYRIGHT_PATH")"
fi

if [ "$FAILURES" -eq 0 ]; then
    echo "check-store-metadata: all locales within budget"
    exit 0
fi
echo "check-store-metadata: $FAILURES check(s) failed" >&2
exit 1

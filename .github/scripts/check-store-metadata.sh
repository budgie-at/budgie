#!/usr/bin/env bash
# Fast PR mirror of the Fastfile's verify_field_budgets gate, which stays the release-time authority.
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../packages/app/fastlane/metadata"

fail() {
    echo "check-store-metadata: $1" >&2
    exit 1
}

for locale in en-US fr-FR uk de-DE es-ES; do
    for budget in ios/name.txt:30 ios/subtitle.txt:30 ios/keywords.txt:100 ios/promotional_text.txt:170 \
        ios/description.txt:4000 ios/release_notes.txt:4000 android/title.txt:30 android/short_description.txt:80 \
        android/full_description.txt:4000 android/changelogs/default.txt:500; do
        field="${budget%:*}"
        limit="${budget##*:}"
        path="${field%%/*}/$locale/${field#*/}"
        [ -f "$path" ] || fail "$path is missing"
        content=$(cat "$path")
        [ "${#content}" -le "$limit" ] || fail "$path is ${#content} characters, over the $limit budget"
        case "$field" in
            */keywords.txt) [[ $content != *", "* ]] || fail "$path has a space after a comma" ;;
        esac
    done
done

grep -q "$(date +%Y)" ios/copyright.txt || fail "ios/copyright.txt does not carry $(date +%Y)"

echo "check-store-metadata: all locales within budget"

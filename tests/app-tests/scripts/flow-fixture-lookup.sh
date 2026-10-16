resolve_flow_file_path() {
    local flow_path="$1"
    local nested_flow_path="$2"

    if [[ "$nested_flow_path" = /* ]]; then
        printf '%s\n' "$nested_flow_path"

        return 0
    fi

    printf '%s/%s\n' "$(dirname "$flow_path")" "$nested_flow_path"
}

extract_database_fixture_name() {
    local flow_path="$1"
    local depth="${2:-0}"
    local fixture_name
    local nested_flow_path
    local nested_fixture_name

    fixture_name="$(sed -n "s/^[[:space:]]*FIXTURE_ROW_ID_MATCH:[[:space:]]*['\"]\\([^'\"]*\\.db\\).*['\"].*/\\1/p" "$flow_path" | head -n 1)"

    if [ -n "$fixture_name" ]; then
        printf '%s\n' "$fixture_name"

        return 0
    fi

    if [ "$depth" -ge 3 ]; then
        return 1
    fi

    while IFS= read -r nested_flow_path; do
        nested_flow_path="$(resolve_flow_file_path "$flow_path" "$nested_flow_path")"

        if [ ! -f "$nested_flow_path" ]; then
            continue
        fi

        nested_fixture_name="$(extract_database_fixture_name "$nested_flow_path" "$((depth + 1))" || true)"

        if [ -n "$nested_fixture_name" ]; then
            printf '%s\n' "$nested_fixture_name"

            return 0
        fi
    done < <(
        awk '/^[[:space:]]*file:[[:space:]]*/ {
            value = $0;
            sub(/^[[:space:]]*file:[[:space:]]*/, "", value);
            gsub(/'\''|"/, "", value);
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", value);
            if (value ~ /\.flow\.yaml$/) {
                print value;
            }
        }' "$flow_path"
    )

    return 1
}

extend_fiat_rates_through() {
    local database_path="$1"
    local through_date="$2"

    sqlite3 -bail "$database_path" "
WITH RECURSIVE latest AS (
    SELECT rates.source_instrument_id, rates.target_instrument_id, MAX(rates.rate_date) AS rate_date
    FROM historical_exchange_rates AS rates
    JOIN instruments AS source ON source.id = rates.source_instrument_id AND source.type = 'FIAT'
    JOIN instruments AS target ON target.id = rates.target_instrument_id AND target.type = 'FIAT'
    WHERE rates.deleted_at IS NULL
    GROUP BY rates.source_instrument_id, rates.target_instrument_id
),
days(source_instrument_id, target_instrument_id, rate_date, rate) AS (
    SELECT latest.source_instrument_id, latest.target_instrument_id, date(latest.rate_date, '+1 day'), rates.rate
    FROM latest
    JOIN historical_exchange_rates AS rates
        ON rates.source_instrument_id = latest.source_instrument_id
        AND rates.target_instrument_id = latest.target_instrument_id
        AND rates.rate_date = latest.rate_date
        AND rates.deleted_at IS NULL
    WHERE latest.rate_date < '$through_date'
    UNION ALL
    SELECT source_instrument_id, target_instrument_id, date(rate_date, '+1 day'), rate FROM days WHERE rate_date < '$through_date'
)
INSERT INTO historical_exchange_rates (source_instrument_id, target_instrument_id, rate_date, rate)
SELECT source_instrument_id, target_instrument_id, rate_date, rate FROM days;
"
}

install_database_fixture() {
    local udid="$1"
    local app_id="$2"
    local app_data_container="$3"
    local fixture_name="$4"
    local fixture_path="$app_data_container/Documents/E2EFixtures/$fixture_name"
    local sqlite_dir="$app_data_container/Documents/SQLite"

    if [ ! -f "$fixture_path" ]; then
        echo "Database fixture not found: $fixture_path" >&2

        return 1
    fi

    xcrun simctl terminate "$udid" "$app_id" >/dev/null 2>&1 || true
    xcrun simctl keychain "$udid" reset >/dev/null 2>&1 || true
    mkdir -p "$sqlite_dir"
    rm -f "$sqlite_dir"/budgie.db*
    cp "$fixture_path" "$sqlite_dir/budgie.db"
    extend_fiat_rates_through "$sqlite_dir/budgie.db" "$(date -v+1d +%F 2>/dev/null || date -d tomorrow +%F)"
    xcrun simctl launch "$udid" "$app_id" >/dev/null
}

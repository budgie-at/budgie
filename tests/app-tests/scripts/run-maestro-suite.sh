#!/bin/sh

set -eu

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <app-id> [maestro args...]"
    exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORKSPACE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

APP_ID="$1"
shift

CONFIG_PATH="${MAESTRO_CONFIG_PATH:-$WORKSPACE_DIR/config.yaml}"
FLOW_DIR="${MAESTRO_FLOW_DIR:-$WORKSPACE_DIR/flows}"
RESET_SCRIPT="${MAESTRO_RESET_SCRIPT:-$WORKSPACE_DIR/scripts/reset-ios-app.sh}"

FLOWS="
01.empty-states.flow.yaml
02.account-bank.flow.yaml
03.account-cash.flow.yaml
04.account-debt-lent.flow.yaml
05.account-debt-borrowed.flow.yaml
06.category.flow.yaml
07.tag.flow.yaml
08.settings-navigation.flow.yaml
09.expense-transaction.flow.yaml
10.income-transaction.flow.yaml
11.transfer-transaction.flow.yaml
12.cross-currency-transfer-transaction.flow.yaml
13.balance-verification.flow.yaml
15.archived-accounts.flow.yaml
17.expense-to-transfer.flow.yaml
18.income-to-transfer.flow.yaml
19.transactions-filters.flow.yaml
20.transactions-account-date.flow.yaml
"

for FLOW in $FLOWS; do
    echo "Running $FLOW"

    if [ "${APP_PLATFORM:-ios}" = "ios" ] && [ -n "${APP_BINARY_PATH:-}" ]; then
        sh "$RESET_SCRIPT" "$APP_ID" "$APP_BINARY_PATH" "${SIMULATOR_UDID:-}"
    fi

    maestro test "$FLOW_DIR/$FLOW" -e APP_ID="$APP_ID" --config "$CONFIG_PATH" "$@"
done

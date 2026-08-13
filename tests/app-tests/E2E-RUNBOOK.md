# Budgie E2E Runbook

Budgie E2E uses `@swmansion/argent` 0.20.0 and deterministic YAML flows in `tests/app-tests/flows`.

## Prerequisites

1. Install workspace dependencies with `yarn install --immutable`.
2. Build and install the `APP_VARIANT=e2e` iOS app (`com.vitalyiegorov.budgie.e2e`) on a booted simulator.
3. Export its UDID as `ARGENT_DEVICE`.
4. Refresh dynamic fixtures:

```bash
node tests/app-tests/scripts/prepare-date-sensitive-fixtures.js
ARGENT_DEVICE="$ARGENT_DEVICE" tests/app-tests/scripts/setup-ios-e2e-fixtures.sh
```

## Static checks

```bash
yarn workspace @budgie-at/app-tests flows:check
```

This checks migration cleanliness, Argent YAML structure and supported directives/tool arguments, exact `run:` targets, unresolved invocation variables, and shard coverage without starting an app.

## Run one flow

```bash
yarn workspace @budgie-at/app-tests exec argent flow run \
  flows/01-account-bank.yaml \
  --platform ios \
  --device "$ARGENT_DEVICE" \
  --output artifacts/argent/01-account-bank
```

## Run a shard or the full suite

```bash
ARGENT_DEVICE="$ARGENT_DEVICE" ARGENT_SHARD=1 yarn workspace @budgie-at/app-tests test:ios
ARGENT_DEVICE="$ARGENT_DEVICE" yarn workspace @budgie-at/app-tests test:ios
```

The runner executes shard entries in file order and stops on the first failed flow. Each invocation is exactly `argent flow run <file> --platform ios --device <udid>` with a deterministic output directory.

## Rebuild discipline

After app code, native configuration, selectors, fixture, or flow assumptions change, force a local E2E native rebuild, reinstall the app, refresh fixtures, and rerun every affected flow. Cached EAS application bundles are not valid evidence unless the installed bundle is confirmed to contain the current JavaScript and native changes.

## Failures

Argent exits non-zero and emits per-step results. Preserve `tests/app-tests/artifacts/argent`, a final simulator screenshot, simulator logs, and crash diagnostics. Fix the first failed identity/action rather than adding broad retries. Raw tools are allowed only with shapes confirmed by the pinned Argent source: `open-url`, `gesture-swipe`, `keyboard`, and `settings-permissions`.

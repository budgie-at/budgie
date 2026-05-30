# E2E Local Run Runbook

How to build, install, and run Maestro flows against real local code. Read this before claiming any E2E result.

## Golden path (iOS simulator)

```bash
# 1. Clean native tree for the e2e variant
cd packages/app && APP_VARIANT=e2e npx expo prebuild -p ios --clean

# 2. Build + install Release on the booted sim (use the real booted UDID from `xcrun simctl list devices booted`)
APP_VARIANT=e2e EXPO_PUBLIC_AI_DISABLE=true EXPO_PUBLIC_LOGGING_DISABLE=true \
  npx expo run:ios --configuration Release --scheme budgieE2E --device <UDID> --port 8082

# 3. Refresh fixtures (reinstall wipes them)
cd ../.. && sh tests/app-tests/scripts/setup-ios-e2e-fixtures.sh <UDID> com.vitalyiegorov.budgie.e2e

# 4. Run a flow
maestro test tests/app-tests/flows/14.transaction-filters.flow.yaml \
  -e APP_ID=com.vitalyiegorov.budgie.e2e --config tests/app-tests/config.yaml
```

## Traps that cost real time

1. **EAS build cache silently serves a STALE binary.** `expo run:ios` honors `experiments.buildCacheProvider: 'eas'` in `app.config.js` and downloads a fingerprint-matched cached `.app` instead of compiling your code (`"Searching builds with matching fingerprint" / "Using custom binary path"` in the log). `--no-build-cache` does **not** stop it. To force a true local compile of code under test, temporarily remove the `buildCacheProvider` line from `app.config.js` (revert after — do not commit). Confirm the log shows local bundling (`iOS Bundled … packages/app/index.js`), not a cached download.
2. **The trailing `osascript … "Simulator" … non-zero` error is benign.** It only fails the post-install window-activation. If the log already shows `Installing on … / Opening on …`, the app built and installed fine; do not treat that exit code as a build failure.
3. **A non-existent `--device` UDID makes Maestro hang with zero output.** Always take the UDID from `xcrun simctl list devices booted`, never from memory or earlier scrolled output.
4. **`continueOnFailure: false`** (config.yaml) — a flow halts at the first failed step; later assertions are never evaluated. Fix the first failure, re-run; don't assume the rest pass.
5. **Verdict comes from the run, not from you.** Only claim pass on observed `MAESTRO_EXIT=0`. Never write a pass count into a commit message before the run finishes.

## After merging `main` into a fixture-changing branch

E2E fixtures (`tests/app-tests/scripts/prepare-date-sensitive-fixtures.mjs`) feed hard-coded assertions in the flows. If your branch adds/removes seeded transactions, `main`'s newer count/total assertions drift and `yarn ts/lint/cpd` cannot catch it. Re-run every Maestro flow that touches the changed fixture and reconcile counts against the **regenerated** fixture, e.g.:

```bash
node tests/app-tests/scripts/prepare-date-sensitive-fixtures.mjs /tmp/fx
sqlite3 /tmp/fx/14.db "SELECT type, COUNT(*) FROM transactions WHERE deleted_at IS NULL GROUP BY type;"
```

## Reading background logs

Maestro/xcodebuild output is CR-heavy. Sanitize before grepping:
`LC_ALL=C tr -cd '\11\12\15\40-\176' < log | LC_ALL=C tr '\r' '\n'`

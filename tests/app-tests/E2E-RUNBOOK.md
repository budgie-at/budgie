# E2E Local Run Runbook

How to build an E2E app and run the e2e suite (`e2e/`) against it on the simlock farm. Read this before claiming any E2E result.

## Golden path

```bash
# 0. The app: the branch's CI artifact is the quickest, a local build otherwise
gh run download <run-id> -n ios-e2e-app-e2e -D /tmp/app && tar -xzf /tmp/app/ios-e2e-app-e2e.tar.gz -C /tmp/app
#    (local build on a Mac: see "Building locally" below)

# 1. The e2e project's dependencies (its own npm project, not a pnpm workspace)
cd e2e && npm ci

# 2. Run one test file, or the whole suite, against simulators leased from the farm
E2E_APP_PATH=/tmp/app/Base.app SIMLOCK_URL=<gateway> SIMLOCK_TOKEN=<agent token> \
  npx e2e run --target ios tests/14.transaction-filters.e2e.ts
```

`SIMLOCK_URL` is `https://simlock.vitaliiyehorov.dev` (the farm's public gateway, which CI uses; `http://10.10.1.28:4700` on the Mac Studio's LAN only); a token comes
from the farm's handoff, never from the CI secret. `E2E_WORKERS=<n>` leases n
simulators and spreads the tests over them. The run report, junit and per-test
traces land in `e2e/.e2e/`; a failed test's `trace.md` has every step and the whole
accessibility tree at the failure, the fastest way to the real testIDs.

## Building locally

```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8   # CocoaPods needs it (trap 2)
cd packages/app && APP_VARIANT=e2e npx expo prebuild -p ios --clean
xcodebuild -workspace ios/budgieE2E.xcworkspace -scheme budgieE2E -configuration Release \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath ~/budgie-e2e-derived \
  CODE_SIGNING_ALLOWED=NO build
```

The app is `~/budgie-e2e-derived/Build/Products/Release-iphonesimulator/budgieE2E.app`.

## Traps that cost real time

1. **EAS build cache silently serves a STALE binary.** `expo run:ios` honors `experiments.buildCacheProvider: 'eas'` in `app.config.js` and downloads a fingerprint-matched cached `.app` instead of compiling your code (`"Searching builds with matching fingerprint" / "Using custom binary path"` in the log). `--no-build-cache` does **not** stop it. Build with `xcodebuild` as above, or temporarily remove the `buildCacheProvider` line (revert after — do not commit).
2. **`pod install` dies instantly in any shell without a UTF-8 locale.** `expo prebuild` fails at the CocoaPods step with `Unicode Normalization not appropriate for ASCII-8BIT (Encoding::CompatibilityError)`. Agent shells, CI runners, and `ssh`/`cron` invocations hit it; export `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` first.
3. **The farm is shared.** One run at a time per agent, never more workers than you need, and never kill a run's container mid-test: it keeps holding its simulators until their lease expires.
4. **Verdict comes from the run, not from you.** Only claim pass on the run's own summary (`Tests  N passed`). Never write a pass count into a commit message before the run finishes.

## After merging `main` into a fixture-changing branch

E2E fixtures (`tests/app-tests/scripts/prepare-date-sensitive-fixtures.js`) feed hard-coded assertions in the tests. If your branch adds/removes seeded transactions, `main`'s newer count/total assertions drift and `pnpm ts/lint/cpd` cannot catch it. Re-run every test that touches the changed fixture and reconcile counts against the **regenerated** fixture, e.g.:

```bash
node tests/app-tests/scripts/prepare-date-sensitive-fixtures.js /tmp/fx
sqlite3 /tmp/fx/14.db "SELECT type, COUNT(*) FROM transactions WHERE deleted_at IS NULL GROUP BY type;"
```

## Not every `NN.db` a test seeds is a file in `fixtures/`

`setup-ios-e2e-fixtures.sh` is the only source of truth for what lands on the simulator, and many fixture names are **aliases or generated copies**, not tracked files. `install_database_fixture ".../01.db" "23.db"` means `budgie.start({ fixture: '23.db' })` seeds `23.db` on the device while the repo only stores `01.db`; `14.db`, `15.db`, `20.db`, `21.db`, `22.db`, `31-debt.db`, `31-transaction-info.db`, `34-matching-rules.db` and `budget-multi-currency.db` are generated into a temp dir by `prepare-date-sensitive-fixtures.js`.

So a test seeding `NN.db` with no `tests/app-tests/fixtures/NN.db` on disk is **normal, not a missing fixture**. Check the install script before "fixing" it, and never commit a stray `fixtures/NN.db` for an aliased name — it would be dead weight the script ignores.

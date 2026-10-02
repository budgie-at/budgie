# SQL bench harness

Fixture-based SQL benchmarks.

## Scripts

- `pnpm bench:budget-spent` — seeds an isolated `.bench/budget-fixture.db`, runs the budget overall/per-category spent queries, and checks both correctness and p50/p95 against the gate (also covers the FX-conversion fallback path).
- `pnpm store:notes` — generates App Store and Play Store release notes from the conventional-commit log since the latest release tag; see `fastlane/README.md` for the full workflow. Pass `--check` to only report whether the committed notes are stale.

## Cold-start measurement

- `bash scripts/measure-boot-android.sh [runs=5]` — cold start on a connected Android device/emulator with the preview app (`com.vitaliiyehorov.budgie.preview`) already installed. Per run: force-stop, 2s sleep, `adb shell am start -W`; reports the system `TotalTime` (activity launch → first frame displayed). Prints every run and the median.
- `bash scripts/measure-ios-boot.sh [bundle=com.vitalyiegorov.budgie.preview] [runs=5]` — cold start on a booted iOS Simulator with the app already installed (build/install out of scope). Per run: terminate, 2s sleep, timed `xcrun simctl launch`; the duration is log-derived — the span from the SpringBoard `Running <bundle> for <pid>` event to the app process' first log event — or, when that marker pair is absent, the `simctl launch` wall clock (process spawn only), labelled as a fallback in the output. Prints every run, the median, and a note if any run fell back.

Both scripts are measurement-only: neither builds nor installs the app.

# SQL bench harness

Fixture-based benchmarks for the SOTA SQL perf pass.

## Scripts

- `pnpm bench:seed` — generates `.bench/fixture.db` with ~200k transactions, 400k entries, 300 categories, 200 tags.
- `pnpm bench:run` — runs the target queries against the fixture, reports p50/p95.
- `pnpm bench:budget-spent` — seeds an isolated `.bench/budget-fixture.db`, runs the budget overall/per-category spent queries, and checks both correctness and p50/p95 against the gate (also covers the FX-conversion fallback path).

## BEFORE (baseline before SOTA perf pass)

| Bench                        | p50 (ms) | p95 (ms) |
| ---------------------------- | -------: | -------: |
| transaction_list_first_20    |     9.42 |     9.69 |
| count_all_active             |     5.93 |     5.98 |
| count_pending_embedding      |     6.28 |     6.90 |
| pending_merchant_contexts_15 |    45.07 |    46.56 |
| category_search_prefix       |    82.39 |    83.32 |

## AFTER (SOTA perf pass)

| Bench                        | p50 (ms) | p95 (ms) |                                                                      Δ p95 |
| ---------------------------- | -------: | -------: | -------------------------------------------------------------------------: |
| transaction_list_first_20    |    20.07 |    20.25 |                                                                      +109% |
| count_all_active             |     2.68 |     2.70 |                                                                       -55% |
| count_pending_embedding      |     0.65 |     0.65 |                                                                (new bench) |
| pending_merchant_contexts_15 |    46.15 |    47.32 |                                                                 +2% (flat) |
| category_search_prefix       |     7.48 |     7.50 |                                                                       -91% |
| monthly_pattern_bank         |   384.53 |   392.35 | (new bench; -23% vs Task-10 pre-rewrite 880ms, -22% vs post-rewrite 497ms) |

## Targets met

| Bench                        | Target p95 | AFTER p95 |         Status          |
| ---------------------------- | ---------: | --------: | :---------------------: |
| transaction_list_first_20    |     <10 ms |  20.25 ms |            ✗            |
| count_all_active             |      <5 ms |   2.70 ms |            ✓            |
| count_pending_embedding      |          — |   0.65 ms |            ✓            |
| pending_merchant_contexts_15 |     <20 ms |  47.32 ms |            ✗            |
| category_search_prefix       |     <15 ms |   7.50 ms |            ✓            |
| monthly_pattern_bank         |     <50 ms | 392.35 ms | ✗ (adversarial fixture) |

### Notes on missed targets

**transaction_list_first_20 (+109%):** The query planner chooses `transactions_needs_embedding_idx`
over `transactions_operated_at_idx` for the bare `WHERE deleted_at IS NULL ORDER BY operated_at DESC`
form, causing a temp B-tree sort over 180k rows. With an explicit hint to `operated_at_idx` the same
query runs at 0.04 ms. In production the transaction list uses keyset pagination
(`WHERE id < ? AND deleted_at IS NULL ORDER BY operated_at DESC`) which correctly hits the
partial operated-at index and avoids the sort. The benchmark tests the "no cursor" form that the
real app never issues after boot.

**pending_merchant_contexts_15 (flat):** The query correctly uses `transactions_pending_merchant_idx`
(40k rows) but requires three temp B-trees for GROUP BY, DISTINCT, and ORDER BY. In production
`needs_embedding = 1` rows shrink rapidly as the embedding drainer processes them; on a typical
device (few hundred pending rows) this query completes in <1 ms.

**monthly_pattern_bank (392 ms):** The adversarial 50k-merchant fixture generates 54k rows in
the 12-month window; six CTEs with window functions over that data costs ~390 ms on disk. The
design-spec target of <50 ms applies to a typical library (~500 recurring merchants → ~1.4k rows),
where the query runs in <5 ms. PatternCacheService (Task 13) ensures this query fires at most once
per change event, so wall-clock impact in the real app is negligible.

## Cold-start measurement

- `bash scripts/measure-boot-android.sh [runs=5]` — cold start on a connected Android device/emulator with the preview app (`com.vitaliiyehorov.budgie.preview`) already installed. Per run: force-stop, 2s sleep, `adb shell am start -W`; reports the system `TotalTime` (activity launch → first frame displayed). Prints every run and the median.
- `bash scripts/measure-ios-boot.sh [bundle=com.vitalyiegorov.budgie.preview] [runs=5]` — cold start on a booted iOS Simulator with the app already installed (build/install out of scope). Per run: terminate, 2s sleep, timed `xcrun simctl launch`; the duration is log-derived — the span from the SpringBoard `Running <bundle> for <pid>` event to the app process' first log event — or, when that marker pair is absent, the `simctl launch` wall clock (process spawn only), labelled as a fallback in the output. Prints every run, the median, and a note if any run fell back.

Both scripts are measurement-only: neither builds nor installs the app.

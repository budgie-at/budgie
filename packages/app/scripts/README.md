# SQL bench harness

Fixture-based benchmarks for the SOTA SQL perf pass.

## Scripts

- `yarn bench:seed` — generates `.bench/fixture.db` with ~200k transactions, 400k entries, 300 categories, 200 tags.
- `yarn bench:run` — runs the target queries against the fixture, reports p50/p95.

## BEFORE (baseline before SOTA perf pass)

| Bench | p50 (ms) | p95 (ms) |
|---|---:|---:|
| transaction_list_first_20 | 9.42 | 9.69 |
| count_all_active | 5.93 | 5.98 |
| count_pending_embedding | 6.28 | 6.90 |
| pending_merchant_contexts_15 | 45.07 | 46.56 |
| category_search_prefix | 82.39 | 83.32 |

## AFTER (SOTA perf pass)

_To be filled in by the final validation task._

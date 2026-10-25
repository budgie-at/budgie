# Native toolchain migration, 2026-10-25

Budgie checks TypeScript with exactly pinned `tsrs@0.18.0-ts7.1.0-dev.20260929` on supported hosts. This matches ToolSense/frontend migration `d57e4fc864d6658aad0872ec6a9497eef1402ede` (PR 28697). Both the npm registry and upstream release notes still identify 0.18 as the published latest; 0.19 is a source candidate.

The installed binary reports TypeScript `7.1.0-dev.20260930.4`, upstream commit `b85298b6a81f`. Native declaration builds remain on `@typescript/native` (`npm:typescript@7.0.2`). These compiler/library versions intentionally differ; passing Budgie diagnostics does not establish universal compiler conformance. TypeScript 6.0.2 and `@effect/language-service@0.87.5` retain the separate `effect:check` gate and all 21 configured Effect error rules. Promise lint rules cannot detect discarded lazy Effects.

## Coverage, builds, and CI

All 18 existing package/test `ts` scripts now check through `scripts/typecheck.cjs` with `--noEmit`. They cover 26 configurations: 18 primary configs, seven additional domain test configs, and amount-input's build config. Native and TSRS `--listFilesOnly` selected identical project-owned files in every config. Native and TSRS normal checks passed without diagnostics before the additional Oxlint rule rollout.

The previous domain `ts` tasks also emitted files consumed through package exports. Turbo now schedules `^build` alongside `^ts`, preserving native declaration/JavaScript production before consumers run. Every existing build command, including Bob's native declaration compiler, remains intact. `pnpm ts:native` supplies the same no-emit coverage and dependency graph using native TypeScript for diagnosis and reproducible comparison; it is not the default on supported TSRS hosts.

TSRS 0.18 publishes macOS arm64 and Linux x64/arm64 GNU/musl binaries. The launcher checks the optional-dependency support matrices and resolves each platform package relative to its compiler package before selection. Windows, Intel macOS, additional native-supported architectures, and hosts missing their TSRS platform package automatically use installed native TypeScript, with a visible message. Hosts with neither supported platform package installed fail explicitly. Linux libc selection uses TSRS's own platform resolver, so an installed binary for the other libc does not qualify. Once selected, missing executables, installation errors, or compiler failures fail immediately rather than triggering a retry with another compiler.

The launcher resolves dependencies relative to the repository, leaves the caller's working directory intact, inherits standard input/output/error, and propagates exit codes and signals. All compiler arguments are passed on, with a compiler-specific build-info path appended. Automatic/native checks cannot overwrite TSRS incremental state; main/test/build configs each have separate `node_modules/.cache/typecheck-<compiler>-<config>.json` files. The adaptive `ts` task has `cache: false`: platform selection happens inside the task, so its actual compiler identity cannot safely enter a direct Turbo invocation's cache key before lookup. Its compiler incremental files are retained locally. Explicit `ts:native` tasks still cache native incremental files, and native build tasks cache `dist/**`, `.next/**`, and `node_modules/.cache/tsbuildinfo.json`. The launcher is a Turbo global dependency. Adaptive typechecks always execute on every host; a cached native success cannot skip a TSRS check or vice versa.

The Actions/script audit found no direct typechecker bypass. PR checks already invoke `pnpm ts`, so the migrated scripts apply there automatically. Build and Effect jobs retain their respective compilers. Reusable mobile lanes invoke package builds; their native environment, fingerprint configuration, and workflow files were not changed. There is no `.github/actions` directory.

Temporary negative probes produced `TS2322` under both compilers in contracts, app, landing, amount-input, and sync-tests. Turbo also returned nonzero for the failing landing check. Probes were removed. Tests against a temporary executable verified argument forwarding, unchanged working directory, stdin/stdout/stderr, compiler-specific cache paths, exact exit 7 without retry, and SIGTERM propagation. Pure selection checks covered ten platform/architecture combinations plus forced native selection; a simulated Intel macOS parent selected and launched the real host native compiler, and a simulated unsupported platform failed explicitly. Real platform binaries were exercised only on Linux x64.

Cache verification removed landing's native incremental file, then restored it through a real `ts:native` Turbo cache hit (1/1 cached, exit 0, 59 ms). Two consecutive adaptive landing checks both executed successfully with 0/1 cached (535 ms and 512 ms). This verifies the final policy: backend-specific native cache restoration works, and adaptive checks cannot be skipped by a shared cached success.

## Performance methodology and initial measurements

Measurements used Linux x64, Node 24.21.0, pnpm 12.14.0, Turbo 2.11.9, and a 24-logical-CPU AMD Ryzen AI 9 HX 470. Runs were serial and interleaved native/TSRS. Each command was `pnpm exec turbo run <task> --force`, with the same 30-task graph: 18 typecheck tasks and 12 native dependency builds. All recorded runs passed, with zero Turbo cache hits. This is a workspace command comparison, including dependency builds and package-manager overhead, not an isolated compiler microbenchmark.

Cold means each compiler's typecheck incremental metadata was deleted before checking. OS filesystem caches and native build metadata were not purged. Warm means compiler metadata was retained, with an initial warmup excluded. An unrelated workspace was benchmarking on the shared host; measurements therefore establish a local indication, not an isolated-host performance guarantee.

Initial measurements, before adding the platform-selection launcher:

- Cold native: 15.926, 18.216, 17.051 seconds; median 17.051 seconds. Largest observed child peak RSS: 2,143,916 KiB.
- Cold TSRS: 9.304, 8.720, 8.573 seconds; median 8.720 seconds, about 49% lower. Largest observed child peak RSS: 1,437,632 KiB, about 33% lower.
- Warm native: 5.351, 5.207, 5.381 seconds; median 5.351 seconds. Largest observed child peak RSS: 723,896 KiB.
- Warm TSRS: 4.022, 4.052, 4.152 seconds; median 4.052 seconds, about 24% lower. Largest observed child peak RSS: 792,516 KiB, about 9.5% higher. There is no warm-memory improvement claim.

Postmigration sanity measurements with the platform launcher (one cold and one warm run per compiler, not a new repeated benchmark): native cold 31.616 seconds / 2,110,456 KiB, native warm 8.095 seconds / 739,676 KiB; TSRS cold 13.835 seconds / 1,337,592 KiB, TSRS warm 5.834 seconds / 738,032 KiB. All four commands passed, 30 tasks each and no Turbo cache hits. These include the rule fixes and the launcher, before the final equivalent Drizzle object-spread correction; shared-host variance makes the earlier medians preferable to single-run speedup claims.

RSS uses Python `resource.getrusage(RUSAGE_CHILDREN).ru_maxrss` from a fresh measuring process for each invocation. On Linux it is KiB and describes the largest child high-water mark propagated through the process tree, not the sum of concurrently resident processes. Earlier single-run baselines supplied with this task were native checking 16.8 seconds, old/new lint 20.164/17.612 seconds, and old/new formatting 0.334/0.142 seconds; those do not share this repeated-run methodology.

## Reproduce profiling

Run from the repository root after `pnpm install`. Run commands sequentially, without other builds/lint/benchmarks. To measure cold typechecks, remove only `typecheck-*.json` from each package/test `node_modules/.cache` before each command. Keep native build metadata and filesystem caches in the same condition for both compilers. For warm measurements, run both commands once before recording three interleaved rounds. `--force` bypasses Turbo's task cache while retaining compiler incrementality.

```sh
pnpm exec turbo run ts:native --force
pnpm exec turbo run ts --force
```

For elapsed wall time and Linux/macOS largest-child peak RSS, invoke this block separately for each task/run, changing `ts` to `ts:native` for the comparison:

```sh
python3 - ts <<'PY'
import resource
import subprocess
import sys
import time

started = time.perf_counter()
result = subprocess.run(['pnpm', 'exec', 'turbo', 'run', sys.argv[1], '--force'])
divisor = 1024 * 1024 if sys.platform == 'darwin' else 1024
print('elapsed_seconds', round(time.perf_counter() - started, 3))
print('largest_child_peak_rss_mib', resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss / divisor)
sys.exit(result.returncode)
PY
```

For compiler counters rather than end-to-end timing, run `pnpm --dir packages/app ts --extendedDiagnostics` and `pnpm --dir packages/app ts:native --extendedDiagnostics`. TSRS supports `--extendedDiagnostics`; its `--generateTrace` does not generate traces. TSRS 0.18 does not implement `--showConfig` or `--init`. Language-server/plugin support is incomplete; this change does not replace editor integration or the Effect CLI gate.

## Oxlint audit and protective rules

The registry latest versions verified on 2026-10-25 are `oxlint@1.89.0`, `oxfmt@0.74.0`, and `oxlint-tsgolint@7.0.2005`. The pinned backend README has 61 implemented rule rows; surrounding prose counts of 60/62 are stale. The frontend schema supports 60: backend 7.0.2005 adds `no-unsafe-enum-assignment`, which frontend 1.89.0 cannot yet configure.

Before this rollout, the effective configuration had 37 explicit typed errors, one typed warning, one preset typed error (`require-array-sort-compare`), five explicitly disabled rules, and 16 supported omitted rules disabled by default. The selected protective additions are:

- `typescript/no-generated-empty-object-type: error`.
- `typescript/no-unsafe-type-assertion: error`.
- `typescript/switch-exhaustiveness-check: [error, {considerDefaultExhaustiveForUnions: false, allowDefaultCaseForExhaustiveSwitch: true}]`.

A candidate run over the existing root lint scope checked 3,331 files with 386 rules, capped at `GOMAXPROCS=2` and `--threads=2`, in 16.07 seconds. It found one generated-empty-object diagnostic, 22 unsafe assertions, and 12 switch-exhaustiveness diagnostics, with no unrelated findings. Nine form fields and their callers now consume concrete `useController` bindings rather than unchecked generic path/value casts. Repeated controller groups share four create/details/balance/update binding hooks with concrete field-name contracts; the title binding now forwards `onBlur`, with ref behavior unchanged. Other fixes use runtime narrowing, ordinary string-keyed entries, and correctly typed server-only static locale catalogs. Enum switches now enumerate every member while retaining their existing default behavior; the boolean switch is an ordered conditional chain. The generated-empty-object fix gives the SQL update reducer a `Record<string, SQL>` accumulator and creates a named fresh update object inside the database callback, allowing structural generic assignment without `Object.assign` or contextual excess-property errors. No catalogs or product copy changed. All 35 candidate findings are resolved without new disables, grandfather/allow-list entries, or duplication exceptions. The resulting typed inventory has 40 explicit error rules, one preset error, one warning, five explicitly off rules, and 13 supported omitted rules still off. No style-only omitted rules are being enabled. Public docs calling generated-empty-object `vnext` lag the pinned implementation and schema, which both support it.

## Final verification

The final source passed the required commands in order, followed by the production build. Every command exited 0:

- `pnpm format`: 0.389 seconds; `/tmp/budgie-final-format.log`.
- `pnpm ts`: 4.246 seconds; 30 successful tasks, including all 18 adaptive checks executing and 12 native dependency builds restored from cache; `/tmp/budgie-final-ts.log`.
- `pnpm lint`: 17.353 seconds; `/tmp/budgie-final-lint.log`.
- `pnpm deadcode`: 2.978 seconds; `/tmp/budgie-final-deadcode.log`.
- `pnpm cpd`: 0.265 seconds; zero clones across 2,048 analyzed files; `/tmp/budgie-final-cpd.log`.
- `pnpm effect:check`: 272.452 seconds; all 16 configured projects reported zero errors, warnings, and messages; `/tmp/budgie-final-effect-check.log`.
- `pnpm build`: 18.835 seconds; 13 successful tasks, 12 restored from cache and the updated landing build executed; `/tmp/budgie-final-build.log`.

Elapsed times above are wall time around each complete pnpm command. Individual Turbo-reported times exclude some launcher/package-manager overhead. Each command's measured time is also saved beside its log as `.time`. `pnpm install --frozen-lockfile`, the launcher syntax/format/lint checks, platform-selection cases, negative probes, process/signal checks, and cache-restoration checks also passed. No workflow files changed, so actionlint was not required. Remote GitHub Actions and non-Linux platform binaries were not executed locally.

Validation caught and resolved an existing object-spread rule conflict in the SQL update fix and five repeated form-controller blocks. The final named update object preserves fresh execution-time values, and four shared controller hooks provide real composition with stable hook order. No checks were disabled or thresholds relaxed. Temporary type-error files and process fixtures were removed; generated reports and graphify output remain ignored. Nothing was staged, committed, or submitted as a pull request.

## Sources

- [TSRS registry package](https://www.npmjs.com/package/tsrs).
- [TSRS release status](https://github.com/oxc-project/tsrs/blob/main/docs/STATUS.md).
- [Pinned TSRS 0.18 compatibility and platform limitations](https://github.com/oxc-project/tsrs/blob/v0.18.0/docs/COMPATIBILITY.md).
- [Oxfmt 0.74.0 release](https://github.com/oxc-project/oxc/releases/tag/oxfmt_v0.74.0).
- [Oxlint 1.89.0 release](https://github.com/oxc-project/oxc/releases/tag/oxlint_v1.89.0).
- [tsgolint 7.0.2005 release](https://github.com/oxc-project/tsgolint/releases/tag/v7.0.2005).
- [Pinned generated-empty-object implementation](https://raw.githubusercontent.com/oxc-project/oxc/oxlint_v1.89.0/crates/oxc_linter/src/rules/typescript/no_generated_empty_object_type.rs).

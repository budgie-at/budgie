# Logger Package Audit Plan

Package: `packages/logger`

## Summary

The logger package is intentionally small. It owns the console transport, build-time logging disable behavior, the `@Log` decorator export, and `getLogger`.

Current pressure points:

- 3 source TypeScript files.
- 3 lint-disable markers, all tied to intentional console transport use.
- Runtime app code still bypasses this package in several places.
- Log-only abstraction in `packages/ai` (`returnCachedEmbedding`).
- Double-logged HTTP flow in monobank client vs base layer.
- `@Log` on per-line parsers in erste inflates log volume ~200–300 entries per statement.
- Raw `String(error)` in bank-sync network error path instead of `getErrorMessage`.
- Missing `readonly` on private static fields adjacent to `@Log`-decorated methods.

## P0: Keep Logger Internals Stable

The package already has a narrow purpose and should not be expanded with log-only abstractions.

Plan:

1. Do not refactor logger internals.
2. Preserve build-time logging disable behavior.
3. Keep console calls isolated to `console-transport.util.ts`.
4. Keep `@Log` and `getLogger` as the app-facing APIs.

## P1: Move Runtime App Logs To Logger APIs

Direct runtime console calls exist in app database boot, importer row handling, currency conversion, and category matching.

Plan:

1. Replace app runtime console calls with `getLogger`.
2. Delete noisy diagnostics that are not useful after sqlite-vec startup is stable.
3. Keep scripts free to print to stdout.
4. Avoid wrappers whose only purpose is to build log strings.

## P1: Consumer-Side Logging Anti-Patterns

Consumer code misuses the logger APIs in four distinct ways: log-only abstractions (rule 34), double-logging the same flow (rule 41), `@Log` on hot-path per-line methods, and raw `String(error)` instead of `getErrorMessage` (rule 8). None of these require changes to the logger package internals — all fixes are in consumer files.

### Log-only abstraction (rule 34)

`returnCachedEmbedding` is a private async method on `EmbeddingService` whose entire body is `void text; return cached`. The `void text` statement exists only to silence an unused-parameter lint error; the method exists only to hang `@Log` on a cache-hit branch. Rule 34 explicitly forbids log-only abstractions.

Evidence:

- `packages/ai/src/embedding/service/embedding.service.ts:49–53` — `returnCachedEmbedding` body is `void text; return cached`. The `@Log` decorator is the sole reason this method exists.

Plan:

1. Remove `returnCachedEmbedding`.
2. Inline the cache-hit `return cached` branch directly inside `generateEmbedding`.
3. If the cache hit warrants a log line, add a single `logger.log` call inline — no wrapper method needed.

### Missing `readonly` on private static fields (rule 39)

The three private static fields on `EmbeddingService` are declared without `readonly`. Rule 39 requires class-owned constants to be `private static readonly`.

Evidence:

- `packages/ai/src/embedding/service/embedding.service.ts:11` — `EMBEDDING_CACHE_LIMIT`, `inferenceQueue`, and `embeddingCache` all lack `readonly`.

Plan:

1. Add `readonly` to each of the three fields.

### Double-logged HTTP flow (rule 41)

`MonobankClient.getTransactions()` wraps a `fetchJson` call with three manual `syncLogger` calls (request entry, success, error). `BaseBankProviderClient.fetchJson()` already emits `http:request` and `http:response:*` logs for every request. The Erste integration does not add these wrapper logs. This is a rule 41 double-log.

Evidence:

- `packages/bank-sync/src/monobank/client/monobank.client.ts:54–72` — three `syncLogger` calls around `fetchJson` that is already instrumented at the base layer.

Plan:

1. Remove the three manual `syncLogger` calls in `MonobankClient.getTransactions()`.
2. If per-integration HTTP telemetry is needed, lift it into `beforeRequest`/`afterResponse` ky hooks on `BaseBankProviderClient` so all integrations share it uniformly (aligns with the ky-create refactor in Theme 8 of the codebase audit).

### `@Log` on per-line parser method (rules 32–34)

`ErsteCardMerchantParser.parse()` carries `@Log`. This method is called once per continuation line during PDF statement parsing — typically 200–300 invocations per statement. Each invocation emits three lifecycle log entries (enter / done / throw). The resulting log volume is noise rather than instrumentation.

Evidence:

- `packages/bank-sync/src/erste/parser/erste-card-merchant.parser.ts:17` — `@Log` on `parse()`, called per continuation line.

Plan:

1. Remove `@Log` from `ErsteCardMerchantParser.parse()`.
2. Retain `@Log` on entry-point parser methods only (e.g. the top-level `ErsteParser.parse()` that drives the full document).

### Raw `String(error)` in error log path (rule 8)

One network error path in `BaseBankProviderClient` uses `String(error)` to format the error message. Every other error path in the codebase uses `getErrorMessage(error)` from `@rnw-community/shared` (rule 8).

Evidence:

- `packages/bank-sync/src/core/client/base-bank-provider.client.ts:122` — `String(error)` in the catch block of the HTTP error handler.

Plan:

1. Replace `String(error)` with `getErrorMessage(error)` imported from `@rnw-community/shared`.

## First Slice

Use the app runtime safety slice:

1. Replace database boot console logs with logger calls or remove them.
2. Replace importer and category matcher console calls with structured logger calls.
3. Leave package internals untouched.

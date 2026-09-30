---
name: effect
description: Mandatory before writing or reviewing ANY logic in this repo - async, IO, errors, services, database, HTTP, background work, React data fetching, state, logging, time, concurrency or tests. All logic is Effect v4 (effect@4 rc); load this skill first.
---

# Effect in Budgie

Every effectful line is Effect. No Promise/async logic, `try`/`throw`, `new Promise`, `setTimeout` loops or cancelled-flag fetches outside the edges below. Pure code (math, parsers, mappers, predicate builders) stays plain TypeScript.

## API truth, in order

1. `node_modules/effect/AGENTS.md` and `node_modules/effect/ai-docs/src/**` (ships with the pinned version), then `node_modules/effect/dist/*.d.ts` and `node_modules/effect/src`.
2. `https://github.com/Effect-TS/effect/blob/main/LLMS.md`.
3. The repo's root `AGENTS.md` "## Effect" section and rules 22, 32, 35, 41, 57, 58, 60.
4. Migrating leftover v3 code: the `effect-v3-to-v4` skill. Never write v3 APIs (`Effect.Service`, `Context.Tag`, `catchAll`); v4 is `Context.Service`, `Effect.catch`.

## Repo patterns

- Imports by subpath only: `import * as Effect from 'effect/Effect'`, never the `effect` barrel.
- Functions: public effectful methods are `Effect.fn('Owner.method')(function* () {...})`; hot-loop helpers use `Effect.fnUntraced`. A repository method whose body is one `Db.query` is a plain arrow field, no `Effect.fn`.
- Database: `Db` (`packages/contracts/src/@generic/service/db.service.ts`). Executed reads and writes are `Db.query(db => builder)`; atomic work is `Db.transaction(effect)` (nested calls reuse the outer transaction, no `tx` params). Query-builder factories for `useDatabaseLiveQuery` stay plain and return a Drizzle builder. Top-level app writes pass `invalidateDatabaseLiveQuery` as the second `Effect.fn` argument.
- Errors: typed channel only. `Schema.TaggedError` classes in `/error/*.error.ts`, created only when a caller branches on them; everything else is a defect. Wrap foreign Promise/SDK/native calls with `Effect.tryPromise`/`Effect.try` at that boundary only. Recover only at edges with `Effect.catchTag`/`catchTags`/`catch`. Log failures once at the edge.
- Services: `Context.Service` + `static readonly layer` only for swappable dependencies (`Db`, `HttpClient`, native invokers, SecureStore) or owned state (caches, queues, `Workload`). Otherwise a plain class with `Effect.fn` fields.
- Validation: Effect `Schema` at boundaries (`Schema.decodeUnknownEffect`, `Schema.toStandardSchemaV1` for forms). No zod, ky or drizzle-zod.
- HTTP: `HttpClient` from `effect/http` with `Schedule` retries and `Effect.timeout`; the runtime provides `FetchHttpClient.layer`.
- Concurrency and time: `Schedule`, `Effect.retry`/`repeat`, `Effect.timeout`, `Effect.sleep`, `Semaphore`, `FiberMap`/`FiberSet`, `Effect.acquireRelease`. No `Promise.race`, generation counters or boolean cancel flags.
- Runtime edges (`packages/app/src/@generic/runtime/app.runtime.ts`): `appRuntime` (`ManagedRuntime`, provides `Db`, `HttpClient`, logger layer, `Workload`) runs effects in hooks, tasks and boot via `appRuntime.runPromise` / `runFork`; the rejection is the original error, so `getErrorMessage(error)` keeps working. `appAtomRuntime` builds atoms.
- React: service-calling state and fetches are `@effect/atom-react` atoms (`appAtomRuntime.atom(Effect...)`, read with `useAtomValue`, results are `AsyncResult`). Live database reads stay `useDatabaseLiveQuery`. Never `useEffect` + async + cancelled flag; when an effect must start from `useEffect`, `runFork` and interrupt the fiber in cleanup.
- Background work: `Workload` (`packages/app/src/@generic/service/workload.service.ts`) serializes work on one lane with `run` (background), `runUser`, `runForeground`, `schedule`/`cancelScheduled`, `block`/`unblock`, `interruptBackground`. Route long imports, consolidation and sync through it.
- Long loops: process in batches and `yield* YIELD_TO_UI` (`@generic/constant/yield-to-ui.constant.ts`, a 1 ms `Effect.sleep`) so the UI can paint.
- Logging: `makeLoggerLayer` from `@budgie/logger` is the only sink; use `Effect.logDebug`/`logError` and `Effect.tapCause(Effect.logError)` at edges. Never `console.*`.
- Tests: `@effect/vitest` with `it.effect` (and `it.layer` for shared layers) in `tests/*`, never `async` test bodies or `runPromise` inside a test. Provide `Db` and other services as layers via `tests/test-kit`. Production packages host no test files.

## Before finishing

`pnpm ts && pnpm lint`; check no `async`, `await`, `try`, `throw`, `new Promise`, `Effect.runPromise`/`runSync` in services.

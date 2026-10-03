---
name: effect
description: Mandatory before writing or reviewing ANY logic in this repo - async, IO, errors, services, database, HTTP, background work, React data fetching, state, logging, time, concurrency or tests. All logic is Effect v4 (effect@4); load this skill first.
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
- Functions: service methods are `m: Effect.fn('X.m')(function* (...) {...})` in the object returned by `make`, named after the service; hot-loop helpers are `make` locals with `Effect.fnUntraced`. A method whose body is one call (a single `Db.query`, or a delegation) is a plain arrow `m: (a: A) => dep.m(a)`, with no `Effect.fn`. Pass another service's method as a value only through an arrow (`(a) => repo.m(a)`).
- Database: `Db` (`packages/contracts/src/@generic/service/db.service.ts`) is a per-call requirement, never captured. Executed reads and writes are `Db.query(db => builder)`; atomic work is `Db.transaction(effect)` (nested calls reuse the outer transaction, no `tx` params). Repositories are services returning Effects, never Drizzle builders; live reads are `databaseQueryAtom([Tables...], effect)` atoms read with `useLiveAtomValue`.
- Errors: typed channel only. `Schema.TaggedError` classes in `/error/*.error.ts`, created only when a caller branches on them; everything else is a defect. Wrap foreign Promise/SDK/native calls with `Effect.tryPromise`/`Effect.try` at that boundary only. Recover only at edges with `Effect.catchTag`/`catchTags`/`catch`. Log failures once at the edge.
- Services: every service and repository is `class X extends Context.Service<X>()('@budgie/<pkg>/X', { make: Effect.gen(function* () { const dep = yield* Dep; ...; return { m } }) }) { static readonly layer = Layer.effect(X, X.make).pipe(Layer.provide([Dep.layer])) }` (`make: Effect.succeed({...})` without dependencies). No constructors, no `this`: dependencies resolve once at the top of `make`, helpers, constants and state are `make` locals, shared repository behaviour is a `make<X>Repository(...)` factory spread into the returned object. Callers use only the tag (`yield* X`, `Effect.flatMap(X, x => ...)`, never `X.use`). Ports (`Db`, native invokers) are layer-less tags. Pure code stays plain with no tag. Register each layer in `appServicesLayer`. Reference: the `tag` slice.
- Validation: Effect `Schema` at boundaries (`Schema.decodeUnknownEffect`, `Schema.toStandardSchemaV1` for forms). No zod, ky or drizzle-zod.
- HTTP: `HttpClient` from `effect/http` with `Schedule` retries and `Effect.timeout`; the runtime provides `FetchHttpClient.layer`.
- Concurrency and time: `Schedule`, `Effect.retry`/`repeat`, `Effect.timeout`, `Effect.sleep`, `Semaphore`, `FiberMap`/`FiberSet`, `Effect.acquireRelease`. No `Promise.race`, generation counters or boolean cancel flags.
- Runtime edges (`packages/app/src/@generic/runtime/app.runtime.ts`): `appRuntime` (`ManagedRuntime`, provides `Db`, `HttpClient`, logger layer, `Workload`) runs effects in hooks, tasks and boot via `appRuntime.runPromise` / `runFork`; the rejection is the original error, so `getErrorMessage(error)` keeps working. `appAtomRuntime` builds atoms.
- React: service-calling state and fetches are `@effect/atom-react` atoms (`appAtomRuntime.atom(Effect...)`, read with `useAtomValue`, results are `AsyncResult`). Live database reads are `databaseQueryAtom` atoms (see Database). Never `useEffect` + async + cancelled flag; when an effect must start from `useEffect`, `runFork` and interrupt the fiber in cleanup.
- Background work: `Workload` (`packages/app/src/@generic/service/workload.service.ts`) serializes work on one lane with `run` (background), `runUser`, `runForeground`, `schedule`/`cancelScheduled`, `block`/`unblock`, `interruptBackground`. Route long imports, consolidation and sync through it.
- Long loops: process in batches and `yield* YIELD_TO_UI` (`@generic/constant/yield-to-ui.constant.ts`, a 1 ms `Effect.sleep`) so the UI can paint.
- Logging: `makeLoggerLayer` from `@budgie/logger` is the only sink; use `Effect.logDebug`/`logError` and `Effect.tapCause(Effect.logError)` at edges. Never `console.*`.
- Tests: `@effect/vitest` with `it.effect` (and `it.layer` for shared layers) in `tests/*` and domain-package `test/` suites, never `async` test bodies or `runPromise` inside a test. Provide `Db` and other services as layers via `tests/test-kit`. `app` and `landing` host no test files.

## Before finishing

`pnpm ts && pnpm lint`; check no `async`, `await`, `try`, `throw`, `new Promise`, `Effect.runPromise`/`runSync` in services.

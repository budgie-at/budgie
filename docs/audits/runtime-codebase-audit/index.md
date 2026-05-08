# Runtime Codebase Audit

Date: 2026-05-08
Branch: `chore/sota-code-audit-plan`
Baseline: `origin/main` at `9b5aadd60`

## Goal

Review Budgie's runtime code for complexity, overengineering, inconsistent conventions, and correctness risks before cleanup work starts. The target outcome is a sequence of small, behavior-preserving refactors that make the mobile app and shared packages easier to reason about, safer to change, and more consistent with `AGENTS.md`.

## Scope

In scope:

- `packages/app`
- `packages/contracts`
- `packages/ai`
- `packages/bank-sync`
- `packages/logger`
- Integration tests and scripts only when they verify the scoped packages.

Out of scope:

- Marketing, SEO, editorial content, and web-only presentation work.
- Functional rewrites during this audit branch.
- New test frameworks in production packages.
- Broad folder moves without a nearby design payoff.

## Package Plans

- [App Plan](./app.md)
- [Contracts Plan](./contracts.md)
- [AI Plan](./ai.md)
- [Bank Sync Plan](./bank-sync.md)
- [Logger Plan](./logger.md)

## Second-Pass Metrics

The reviewed package set contains about 50k TypeScript/TSX lines after excluding generated output, native build folders, and package build artifacts.

- Source files: `app` 950, `contracts` 269, `bank-sync` 71, `ai` 36, `logger` 3.
- Largest complexity hotspots: `user-icon-name.enum.ts`, transaction repositories, consolidation services, AI lifecycle services, importer service, sync services, and long form components.
- Lint-disable markers: 190 total across scoped packages.
- Non-`as const` assertion matches: 212, mostly in `contracts` SQL typing and `app` form/router framework boundaries.
- Focused canonical guard-pattern candidates: 67, mostly in `app`, contracts repositories, and `bank-sync`.
- App `useEffect` call sites: 71.
- Runtime `console.*` calls exist outside the logger transport in database boot, importer row handling, currency conversion, and category matching.

## Recommended Strategy

Use layered cleanup sprints rather than package-by-package churn.

1. Runtime safety and rule alignment.
2. App infrastructure and modal/voice lifecycles.
3. Sync/import/consolidation service boundaries.
4. Contracts SQL boundary hardening.
5. AI service simplification.
6. Bank parser and mapper consistency.
7. Logger cleanup and transport boundaries.

This order puts high-risk runtime behavior first and delays low-value structural cleanup until the code is already being touched.

## Cross-Cutting Findings

## 1. Lint Disables Are Concentrated Around Real Design Pressure

The scoped packages have 190 lint-disable markers. The largest clusters are app orchestration components, AI drainer/subsystem services, database boot, import/sync services, and SQL-heavy repositories.

Keep exceptions that protect necessary locality:

- Sequential sync and model-processing loops.
- Dense SQL query pipelines where splitting would hide CTE flow.
- Domain parsers with bank-specific regex and state transitions.
- Logger console transport.

Refactor exception clusters that hide avoidable coupling:

- Runtime database boot logging and setup.
- Route/form components exceeding size rules because they own too many decisions.
- Modal flows that depend on promise resolver refs.
- Importer and sync services that mix parsing, persistence, progress, logging, and recovery.

## 2. Runtime Logging Is Not Consistently Routed

The logger package intentionally owns `console.*`, but app runtime code still logs directly in:

- `packages/app/src/@generic/drizzle/db/db.ts`
- `packages/app/src/import/service/importer.service.ts`
- `packages/app/src/transaction/hook/use-currency-conversion.hook.ts`
- `packages/app/src/sync/service/privatbank-category-matcher.service.ts`

Plan:

1. Replace runtime direct console calls with `getLogger` from `@budgie/logger`.
2. Remove noisy sqlite-vec boot logs unless they are needed for release diagnostics.
3. Keep scripts free to use console output.
4. Make import row failures observable through structured result data, not only logs.

## 3. Assertions Are Hiding Boundary Weaknesses

The scoped audit found 212 non-`as const` assertion matches. Most are caused by two patterns:

- Raw SQL result generics in contracts repositories.
- Generic form/controller and router boundaries in app components.

Plan:

1. At raw SQL boundaries, prefer row schemas, row builders, or narrowly typed mapper functions for high-risk queries.
2. At form boundaries, replace repeated `Path<T>` assertions with field-specific components or typed field props when a component is already tied to one schema field.
3. Keep centralized typed object helpers if they remain the only practical way to preserve object key/value inference.
4. Avoid adding new assertions to satisfy framework APIs without first checking whether the caller can be made more specific.

## 4. Folder Naming Drift Is Creating Local Friction

The app package has both `util` and `utils`, both `constant` and `constants`, and an import `schema` folder for form-like validation. This conflicts with current repo rules and makes new code placement less predictable.

Plan:

1. Standardize touched app modules on `utils`, `constant`, `interface`, `type`, `type-guard`, and `enum`.
2. Move `settings/constants` to `settings/constant` during the next settings change.
3. Move app import schemas into `import/constant` unless a schema becomes a shared contract.
4. Do not do a repo-wide rename as a standalone PR.

## 5. Async Lifecycles Need Sharper Ownership

Several app flows use broad hooks, recursive async flows, or stored promise resolvers:

- `useModalResolver` stores a resolver ref and returns `open(): Promise<TResult>`.
- `VoiceInputOverlay` bridges callback collection through a local `new Promise`.
- `useSuggestionBase` has an intentionally suppressed effect dependency list and stale closure risk around readiness/progress values.
- `useRecording` owns recorder setup, silence detection, buffer conversion, logging, and UI state in one hook.

Plan:

1. Replace modal resolver-ref bridging with explicit session state or callback-based modal APIs.
2. Keep mount-only cleanup ref patterns where they are already intentional and documented.
3. Split recording internals only along real ownership boundaries: recorder lifecycle, sample conversion, silence detection, and UI state.
4. Snapshot typed-array data before handing it to long-lived collectors. Native audio buffers can be reused across callbacks.
5. Rework `useSuggestionBase` dependency handling so the effect is either dependency-correct or uses refs deliberately for every intentionally live value.

## Priority Backlog

## P0: Immediate Safety And Rule Alignment

1. Route runtime console calls through `@budgie/logger` or remove them.
2. Replace the modal resolver-ref promise bridge.
3. Snapshot native audio typed arrays before retention.
4. Fix the known bank-sync canonical guard warning.
5. Remove or dev-gate deprecated database reset export.

## P1: Behavior-Preserving Complexity Reduction

1. Split database boot into focused private boot steps.
2. Refactor importer internals into parse/validate/discover/build phases.
3. Split sync service private methods by retry, fetch, persist, and cursor update responsibilities.
4. Separate consolidation discovery from execution while keeping atomic writes.
5. Add row validation or builders to high-risk raw SQL query outputs.

## P2: Architecture Cleanup

1. Thin oversized route files into route shell plus focused screen component.
2. Flatten AI lifecycle inheritance where it obscures ordering.
3. Prune contracts root exports to the actual public surface.
4. Standardize touched app folders on current repo naming rules.
5. Reduce form/controller type assertions by making field components less generic.

## Verification Plan

For every cleanup PR:

1. Run `yarn format`.
2. Run `yarn ts`.
3. Run `yarn lint`.
4. Run `yarn deadcode`.
5. Run `yarn cpd`.
6. For contracts SQL changes, run targeted `EXPLAIN QUERY PLAN` and the relevant bench script.
7. For bank-sync and consolidation changes, run the relevant integration scenarios.
8. For voice/audio changes, rebuild the app and manually verify recording, silence detection, cancel, re-record, and save routing.

## Review Gate

Do not start implementation from this plan until the first cleanup slice is chosen. The recommended first slice is app runtime safety: database boot logging, deprecated reset export, native audio sample copying, and the known bank-sync guard warning. That slice has low product behavior risk and directly improves rule alignment.

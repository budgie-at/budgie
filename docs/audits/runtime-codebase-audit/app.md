# App Package Audit Plan

Package: `packages/app`

## Summary

The app package carries the highest runtime risk and the most complexity. It owns database boot, repository construction, modal navigation flows, import and sync orchestration, consolidation execution, AI runtime integration, form screens, and native audio capture.

Current pressure points:

- 950 source TypeScript/TSX files.
- 71 `useEffect` call sites.
- 165 lint-disable markers in the scoped second pass.
- 86 non-`as const` assertion matches.
- Runtime `console.*` calls outside the logger package.
- Inconsistent `util`/`utils`, `constant`/`constants`, and import `schema` folders.
- Mount-time service starts in `useAppInitialization` re-fire on every `success` change.
- React 19 Compiler is enabled but manual `useMemo`/`useCallback` linger in at least two files.
- Single-subscription snapshot hooks are thin, but some are still useful semantic facades over store subscriptions. Keep them unless deleting one removes duplication without leaking store internals into components.
- `app/src/ai/util/` and `app/src/ai/utils/` both exist; current repo rules prefer `utils` for utilities and `constant` for constants. `ai-constants.util.ts` is misnamed because it exports only constants.
- Magic-string literal unions for tab identities, recording state, and llama pooling type belong as enums.
- `useAppState` listener re-subscribes on every state change (stale-closure churn, rule 52).
- Root `CLAUDE.md` and `packages/app/CLAUDE.md` document Expo 54; `packages/app/package.json` is on `~55.0.15`.

## P0: Database Boot Is Too Broad

`packages/app/src/@generic/drizzle/db/db.ts` currently owns:

- SQLite open and global caching.
- PIN lookup and SQLCipher keying.
- PRAGMA tuning.
- sqlite-vec extension loading.
- vector table creation.
- direct console diagnostics.
- Drizzle instance creation.
- repository construction.
- deprecated reset export.

This sits on the app boot path and every repository import depends on it.

Plan:

1. Split into private boot functions in the same module first: open database, apply encryption key, apply PRAGMAs, initialize vector extension, create Drizzle DB, create repositories.
2. Move PRAGMA and vector-table SQL strings to module-owned static constants only if reused within the module.
3. Remove or dev-gate `__REMOVE_ME_RESET_DB`.
4. Route diagnostics through `getLogger` or delete them.
5. Keep repository exports stable during the first pass to avoid touching the whole app at once.

## P0: Modal Resolver Pattern Violates Current Architecture Rules

`useModalResolver` stores a promise resolver in a ref. This conflicts with the repo rule against deferred-promise resolver-ref bridging (rule 50) and makes cancellation, double-open behavior, and unmount behavior hard to reason about.

Evidence:

- `packages/app/src/@generic/hook/use-modal-resolver/use-modal-resolver.hook.ts:16` — `resolverRef = useRef<((result: TResult) => void) | null>(null)` bridges `open()` Promise to `resolve()` settler.

Plan:

1. Inventory every `create-modal-context` and `useModalResolver` consumer.
2. Pick one replacement shape for route-backed modals: callback result, context session state, or explicit event reducer.
3. Convert one low-risk selector first.
4. Convert voice review and split/consolidation flows only after the new shape handles cancellation and skip-back behavior.

## P1: Importer Service Mixes Too Many Responsibilities

`ImporterService` currently normalizes CSV rows, discovers entities, creates accounts/categories, parses dates and amounts, builds transaction inputs, mutates progress, and logs row failures.

Risks:

- `fallbackCategory` starts as an asserted empty entity.
- Currency/account lookups can fail late.
- Row errors are logged but not exposed as structured import diagnostics.
- `parseFloat` and `isNaN` checks bypass stronger validation.
- CSV parsing is callback-based and wrapped in a local Promise.

Plan:

1. Introduce a row parse result shape local to the importer module.
2. Replace asserted fallback category with an explicit lookup failure path.
3. Separate row normalization, row validation, entity discovery, and transaction input construction as private methods first.
4. Return row-level diagnostics in the import progress model before changing UI behavior.
5. Keep Papa parsing isolated behind one small adapter.

## P1: Sync Services Need Smaller Transactional Boundaries

`MonobankSyncService` coordinates background task semantics, retry thresholds, provider calls, account lookup, MCC mapping, transaction writes, progress updates, and consolidation triggering.

Plan:

1. Keep the public sync API stable.
2. Extract private methods by transaction boundary: load sync candidates, fetch provider batch, persist batch, update sync cursor, record retry/failure.
3. Make retry decisions pure where possible so background task behavior is easier to audit.
4. Keep rate-limit pauses explicit and provider-owned.
5. Add or reuse bank-sync integration tests for cursor advancement and retry behavior.

## P1: Consolidation Is Correctness-Critical And Too Wide

`transfer-consolidation.service.ts` coordinates candidate discovery, previews, background registration, consolidation execution, tag movement, entry movement, transaction writes, and balance updates.

Plan:

1. Split discovery from execution in the app layer while leaving repository queries intact at first.
2. Keep each consolidation type as a named executor path: pair, ATM cash withdrawal, IBAN bridge, refund.
3. Keep database writes in explicit `transactionAsync` blocks.
4. Run existing bank-sync integration scenarios after every change.
5. Add `EXPLAIN QUERY PLAN` checks before changing candidate SQL.

## P1: Voice And Suggestion Lifecycles Need Ownership Cleanup

Risks:

- `VoiceInputOverlay` bridges callback collection through a local `new Promise`.
- `useSuggestionBase` suppresses effect dependencies and has stale closure risk around readiness/progress values.
- `useRecording` forwards mono native `Float32Array` channel data directly.

Plan:

1. Snapshot mono channel samples with `new Float32Array(buffer.getChannelData(0))` before forwarding.
2. Keep multi-channel averaging as copied output.
3. Rework `useSuggestionBase` dependency handling so the effect is either dependency-correct or uses refs deliberately for every intentionally live value.
4. Avoid duplicate hook-level logs for flows already covered by service-level `@Log`.
5. Verify voice capture manually after native audio changes.

## P1: Mount-Time Service Starts Belong In Providers

`useAppInitialization` fires sync and background-task registration calls inside a `useEffect` keyed to a `success` boolean. Every render that flips `success` re-runs the entire boot sequence. Rule 46 forbids mount-time service starts in hooks consumed by screens when an app-level provider already owns those singletons.

Evidence:

- `packages/app/src/@generic/hook/use-app-initialization.hook.ts:15` — `useEffect([success])` calls `exchangeRatesSyncService.sync()`, `exchangeRatesSyncService.registerBackgroundTask()`, `accountBalanceIncrementalService.updateAllBalances()`, `accountBalanceIncrementalService.registerBackgroundTask()`, `monobankSyncService.sync()`, `monobankSyncService.registerBackgroundTask()`, and `transferConsolidationService.registerBackgroundTask()`.

Plan:

1. Move each service start to the provider that owns the relevant singleton (or a peer boot provider at the same level as `AiProvider`).
2. Remove `useAppInitialization` after its calls are relocated; if `SplashScreen.hideAsync` is the only survivor, keep it inline at the root layout.
3. Verify background-task registration is idempotent before moving — if not, guard with a ref, not a re-render.

## P1: AI Module Artifact Sprawl And Folder Drift

Several `util/` files and hook files in the AI module are consumed by exactly one site, violating rules 38/42/43/51. Additionally, `app/src/ai/util/` and `app/src/ai/utils/` both exist; only `utils` should remain for utilities, while constants belong in `constant`.

Evidence:

- `packages/app/src/ai/util/run-completion.util.ts:8` — single consumer `chat.service.ts`. Belongs as `private runCompletion(...)` on `ChatService`.
- `packages/app/src/ai/util/load-llama-context.util.ts:23` — single consumer `base-subsystem.service.ts`. Same for `download-model.util.ts` in the same folder.
- `packages/app/src/ai/util/ai-constants.util.ts` — named `*.util.ts` but exports only constants (12 `const` declarations, no functions). Multiple service consumers share it, so it stays a file; rename to `ai-models.constant.ts` (rule 10).
- `packages/app/src/ai/utils/build-subsystem-snapshot.util.ts` — two service consumers. This is a valid shared utility and should remain unless the two status services diverge.
- `packages/app/src/@generic/hook/use-screenshot-protection.hook.ts:3` — two consumers and a clear domain name. Keep it; inlining would duplicate the setting key.
- `packages/app/src/@generic/hook/use-previous.hook.ts` — single consumer `tick.tsx` (rule 51). Inline as a module-level helper in that file.
- `packages/app/src/ai/hook/use-audio-manager.hook.ts:13` — entire body is `useEffect(() => void setup(), [])`. Single consumer `useRecording`. Inline the setup call into `useRecording`'s existing effect (rule 47).
- `packages/app/src/ai/hook/use-ai-system-status.hook.ts`, `use-ai-system-umbrella.hook.ts`, `use-ai-translation-status.hook.ts`, `use-stt-snapshot.hook.ts` — thin subscription hooks with semantic names. Keep the multi-consumer hooks; only revisit if one becomes single-consumer or if the store API changes.

Plan:

1. Inline `runCompletion`, `loadLlamaContext`, `downloadModel` as private methods on their owning service classes. Delete the three util files.
2. Move shared constants from `ai-constants.util.ts` to `ai/constant/ai-models.constant.ts`; update all import paths.
3. Keep `build-subsystem-snapshot.util.ts` in `utils`; it has two real consumers.
4. Inline `usePrevious` at `tick.tsx`. Keep `useScreenshotProtection` because it names a shared setting key used by two components.
5. Move the `useAudioManager` setup call into `useRecording`. Delete `use-audio-manager.hook.ts`.
6. Keep the multi-consumer `useSyncExternalStore` snapshot hooks unless a later refactor makes a hook single-consumer.

## P1: Magic-String Unions Must Become Enums

Tab identities, recording state, and llama pooling type are typed as literal string unions instead of enums. Rule 45 requires promotion when a union is referenced by ≥2 sites. Rule 28 requires `UPPER_CASE` keys and values.

Evidence:

- `packages/app/src/@generic/type/analytics-tab.type.ts:1` — `'categories' | 'tags'`, referenced at `analytics.tsx` and `statistics-content.tsx` (≥5 sites total across the module).
- `packages/app/src/@generic/type/transactions-tab.type.ts:1` — `'transactions' | 'recurring'`, multi-site.
- `packages/app/src/@generic/type/form-field-status.type.ts:1` — `'default' | 'error'`, multi-site.
- `packages/app/src/ai/hook/use-recording.hook.ts:24` — `type RecordingStatus = 'idle' | 'recording'` overlaps `VoiceInputStateEnum` already defined in the same AI module.
- `packages/app/src/ai/interface/llama-config.interface.ts:6` and `packages/app/src/ai/util/load-llama-context.util.ts:17` — `poolingType?: 'mean' | 'none' | 'cls' | 'last'` duplicated identically across two files (rules 28, 45).

Plan:

1. Promote `AnalyticsTabType`, `TransactionsTabType`, `FormFieldStatus` to `*Enum` files in the respective module's `enum/` folder. Update all import and comparison sites.
2. Replace `RecordingStatus = 'idle' | 'recording'` with `VoiceInputStateEnum` (or extend it if values differ). Remove the local type.
3. Extract `PoolingTypeEnum` (or a `LlamaPoolingTypeEnum`) for the four pooling-type values. Reference it in both `llama-config.interface.ts` and `load-llama-context.util.ts`.

## P1: Latent Correctness — `useAppState` Listener Churn

`useAppState` re-subscribes `AppState.addEventListener` on every state change because `appState` is in the `useEffect` dependency array. This creates and tears down a native listener on each transition, which is both wasteful and fragile. Rule 52 requires cleanups to capture their target via a stable ref, not deps.

Evidence:

- `packages/app/src/@generic/hook/use-app-state.hook.ts:8` — `useEffect(() => { const subscription = AppState.addEventListener(...) }, [appState, onChange])` re-fires on every `appState` update.

Plan:

1. Move `appState` reads inside the listener closure via `useRef` so the listener is registered once on mount.
2. Store `onChange` in a ref updated each render; the cleanup reads `ref.current` as described in rule 52.
3. Keep the `setAppState(nextAppState)` state update inside the stable listener.

## P2: React 19 Compiler — Remove Lingering Manual Memoization

The React 19 Compiler is enabled (`babel-plugin-react-compiler`) and app CLAUDE.md rule 3 bans manual `useMemo`/`useCallback`. Two files still use them.

Evidence:

- `packages/app/src/@generic/component/date-picker/date-picker.tsx:72` — `useMemo(() => buildStyles(isDarkColorSchema), [isDarkColorSchema])`.
- `packages/app/src/@generic/hook/use-create-action.hook.ts:11` — `useCallback` wrapping `useFocusEffect`.

Plan:

1. Remove `useMemo` in `date-picker.tsx`; assign `buildStyles(isDarkColorSchema)` directly. Remove the `useMemo` import if unused.
2. Remove `useCallback` in `use-create-action.hook.ts`; pass the callback inline to `useFocusEffect`. Remove the `useCallback` import if unused.

## P2: Stack Version Drift In Documentation

Root `CLAUDE.md` and `packages/app/CLAUDE.md` both state "Expo 54" in the tech-stack table, but `packages/app/package.json` has `expo: ~55.0.15`.

Evidence:

- `packages/app/package.json` — `"expo": "~55.0.15"`.
- `CLAUDE.md` (root) tech-stack table — `Expo 54`.
- `packages/app/CLAUDE.md` tech-stack section — `Expo 54`.

Plan:

1. Update both `CLAUDE.md` files to read "Expo 55".

## P2: Large Form And Route Components Should Become Thin Shells

Long route and form files are not automatically wrong, but repeated max-lines/max-statements suppressions show that some files own route setup, form state, derived labels, async saves, confirmation dialogs, and navigation.

Plan:

1. Prioritize route files over reusable components because route shells are easier to thin.
2. Extract screen components only when the route file mostly wires params, providers, and navigation.
3. Extract form schemas into `constant` folders before moving form components.
4. Keep single-consumer helpers inline unless they are true domain interfaces or enums.

## First Slice

Start with app runtime safety:

1. Database boot logging and deprecated reset export.
2. Native audio sample copying.
3. `useSuggestionBase` dependency strategy.
4. Direct runtime console calls in importer, currency conversion, and category matcher.
5. `useAppState` listener churn — low-risk, high-correctness payoff.
6. AI module single-consumer util/hook inlining — mechanical, but only for proven single-consumer helpers.
7. `useMemo`/`useCallback` removal in `date-picker.tsx` and `use-create-action.hook.ts`.

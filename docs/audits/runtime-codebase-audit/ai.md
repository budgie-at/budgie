# AI Package Audit Plan

Package: `packages/ai`

## Summary

The AI package is comparatively small and cohesive. The main complexity is language-aware voice extraction, embedding suggestion ranking, and app-side AI lifecycle integration that depends on these package contracts.

Current pressure points:

- 36 source TypeScript files.
- 3 lint-disable markers.
- 3 focused canonical guard-pattern candidates.
- Longest file is `voice/service/voice-llm.service.ts`.
- App-side AI lifecycle services are reviewed in the app plan because they live under `packages/app/src/ai`.
- `EmbeddingSuggestionService` constructs `EmbeddingService` per-call rather than injecting it, obscuring static cache ownership.
- `returnCachedEmbedding` in `EmbeddingService` exists solely to attach `@Log` to a cache-hit; the method body is `void text; return cached`.
- Two parallel `SuggestionStatus`/`SuggestionInternalStatus` string-literal types; both compared raw at `use-suggestion-base.hook.ts:39,76,83,91,104`.
- Voice-prompt constants and generation options exported from a separate file that has exactly one importer.
- Four embedding util files each declare their own private input-shape interface inline instead of using the module's `/interface` folder.
- `PrepareSuggestionResultInterface.methodStart` is set but never read at any call site, leaving the interface as a de-facto single-field wrapper.

## P0: Voice Extraction Has The Right Data Coverage But Broad Ownership

`VoiceLlmService` keeps keyword tables, regex construction, simple parsing, prompt invocation, schema validation, and output normalization together.

Good:

- Language tables are exhaustive via `Record<LanguageEnum, ...>`.
- The service has cohesive domain ownership.
- Fallback from simple parsing to LLM extraction is easy to follow.

Risks:

- Keyword changes and parsing behavior changes share one file.
- Regex construction has broad blast radius.
- Simple parser behavior is harder to fixture-test outside the full service.

Plan:

1. Keep language keyword tables colocated unless another service needs them.
2. Extract pure simple-voice parsing only when adding fixture verification.
3. Keep LLM prompt invocation in the service.
4. Add table-driven manual fixtures through TypeScript scripts or approved integration locations, not new production-package unit tests.

## P1: Embedding APIs Carry Positional Argument Pressure

Embedding services use max-params exceptions around existing APIs and `@Log` hook requirements. Reshaping public method arguments just to satisfy lint would violate repo rules.

Plan:

1. Keep public positional arguments unless a narrower domain object encodes a real invariant.
2. Split private implementation methods when it improves readability.
3. Keep log hooks direct on the methods rather than adding log-only wrappers.
4. Validate serialized embedding boundaries where app code passes data to SQLite vector storage.

## P1: Package Constants Should Remain Package-Owned

The AI package contains audio constants, embedding constants, prompt constants, and voice prompt generation settings.

Plan:

1. Keep model and prompt constants close to the services that consume them.
2. Do not move constants into app just because app is the only current runtime consumer.
3. Keep generated prompt strings out of app UI i18n concerns because they are model prompts, not user-facing copy.

## P1: Single-Consumer Constants Must Move Inside Their Service (Rules 39/43/51)

`voice-prompt.constant.ts` exports `ITEM_EXTRACTION_PROMPT` and `VOICE_EXTRACTION_GENERATION_OPTIONS`. Both are imported at exactly one site. The parallel `jsonSchema` in the generation options duplicates the shape already defined by `EXTRACTED_ITEM_SCHEMA` in `voice-llm.service.ts`, meaning the same JSON structure is maintained in two places with no shared source of truth. Zod 4 ships `z.toJSONSchema()` — the options object should derive its `jsonSchema` field from the existing Zod schema rather than hand-rolling the equivalent.

Evidence:

- `packages/ai/src/voice/constant/voice-prompt.constant.ts:3` — `ITEM_EXTRACTION_PROMPT` sole importer: `voice-llm.service.ts:9`
- `packages/ai/src/voice/constant/voice-prompt.constant.ts:21` — `VOICE_EXTRACTION_GENERATION_OPTIONS` sole importer: `voice-llm.service.ts:9`
- `packages/ai/src/voice/service/voice-llm.service.ts:15–19` — `EXTRACTED_ITEM_SCHEMA` Zod definition whose JSON shape is re-stated inline in the constant above
- `packages/ai/src/voice/constant/voice-prompt.constant.ts:25–38` — hand-written `jsonSchema` duplicates `EXTRACTED_ITEM_SCHEMA` fields

Plan:

1. Delete `voice-prompt.constant.ts`.
2. Move `ITEM_EXTRACTION_PROMPT` to `private static readonly ITEM_EXTRACTION_PROMPT` on `VoiceLlmService`.
3. Derive `jsonSchema` via `z.toJSONSchema(VoiceLlmService.EXTRACTED_ITEM_SCHEMA)` and inline the resulting options object as `private static readonly VOICE_EXTRACTION_GENERATION_OPTIONS`.
4. Delete any now-unused import from the constant file.

## P1: `EmbeddingService` Injected Ephemerally Instead of via Constructor (Rule 22)

`EmbeddingSuggestionService.generateSerializedEmbedding` constructs `new EmbeddingService(this.embedding)` on every call. `EmbeddingService` holds static inference-queue and cache state, so the ephemeral instance still shares that global state — but the per-call construction obscures who owns the cache and makes the dependency invisible at the class boundary. Rule 22 requires services to be class instances; the owning service should receive a collaborator, not construct it.

Additionally, `getMccCategorySuggestions` is injected as a raw function pointer rather than a typed repository interface, inconsistent with how other repository collaborators are injected via `EmbeddingSuggestionRepositoriesInterface`.

Evidence:

- `packages/ai/src/embedding/service/embedding-suggestion.service.ts:164` — `new EmbeddingService(this.embedding)` inside a private method
- `packages/ai/src/embedding/service/embedding-suggestion.service.ts:36–39` — raw function injection `(mccCategoryId: number, limit: number) => Promise<...>`
- `packages/ai/src/embedding/service/embedding.service.ts:9–11` — static `inferenceQueue`, `embeddingCache`, `EMBEDDING_CACHE_LIMIT` all missing `readonly` (rule 39)

Plan:

1. Add `EmbeddingService` as a constructor parameter on `EmbeddingSuggestionService`; remove the per-call instantiation in `generateSerializedEmbedding`.
2. Add `readonly` to `EmbeddingService.inferenceQueue`, `embeddingCache`, and `EMBEDDING_CACHE_LIMIT` (`packages/ai/src/embedding/service/embedding.service.ts:9–11`).
3. Evaluate typing `getMccCategorySuggestions` as a narrow repository interface method rather than a raw function pointer, consistent with `EmbeddingSuggestionRepositoriesInterface`.

## P1: Log-Only Method Violates Rules 33 and 34

`EmbeddingService.returnCachedEmbedding` is a private async method whose entire body is `void text; return cached`. The `void text` silences an unused-param lint error caused by the `@Log` hook needing `text` in scope; the method exists solely so that `@Log` can record a cache-hit lifecycle event. Rule 34 forbids log-only abstractions. Rule 33 forbids reshaping arguments to satisfy lint.

Evidence:

- `packages/ai/src/embedding/service/embedding.service.ts:43–53` — `returnCachedEmbedding` with `void text; return cached` body
- `packages/ai/src/embedding/service/embedding.service.ts:22–23` — call site: `return this.returnCachedEmbedding(text, cached)` where cache-hit can be inlined directly

Plan:

1. Remove `returnCachedEmbedding`.
2. Return `cached` inline at `generateEmbedding:22–23`; the parent `@Log` on `generateEmbedding` already records entry and result for the cache-hit path.

## P1: Suggestion Status Types Are Magic-String Unions — Collapse to One Enum (Rules 28/45)

`SuggestionStatus` (`'idle' | 'initializing' | 'loading' | 'success' | 'error'`) and `SuggestionInternalStatus` (`'idle' | 'loading' | 'success' | 'error'`) live in two separate `.type.ts` files. Their relationship is implicit: `SuggestionStatus` is `SuggestionInternalStatus | 'initializing'`, synthesized by a ternary at the hook call site. All five string values are compared raw at `use-suggestion-base.hook.ts:39,76,83,91,104,107`, defeating refactoring safety and exhaustiveness checks. Rule 45 requires hook state-machine unions referenced at ≥2 sites to become enums.

Evidence:

- `packages/ai/src/suggestion/interface/suggestion-status.type.ts:1` — `'idle' | 'initializing' | 'loading' | 'success' | 'error'`
- `packages/ai/src/suggestion/interface/suggestion-internal-status.type.ts:1` — `'idle' | 'loading' | 'success' | 'error'`
- `packages/app/src/ai/hook/use-suggestion-base.hook.ts:39,76,83,91,104,107` — raw string comparisons and assignments across 7 lines
- `packages/ai/src/index.ts:26–27` — both types re-exported as the package public surface

Plan:

1. Create `packages/ai/src/suggestion/enum/suggestion-status.enum.ts` with `SuggestionStatusEnum` covering `IDLE`, `INITIALIZING`, `LOADING`, `SUCCESS`, `ERROR` (all `UPPER_CASE` values per rule 28).
2. Delete `suggestion-status.type.ts` and `suggestion-internal-status.type.ts`.
3. Replace all raw string literals in `use-suggestion-base.hook.ts` and any app consumers with `SuggestionStatusEnum.*`.
4. The `SuggestionInternalStatus` subset is no longer needed — the enum covers the full union; derive the "is initializing" branch from `SuggestionStatusEnum.INITIALIZING` directly.
5. Update `packages/ai/src/index.ts` to export the enum in place of the two type aliases.

## P2: Inline Input-Shape Interfaces in Embedding Utils (Rule 19)

Four embedding util files each declare a private input-shape interface inline instead of placing it in the module's `/interface` folder. Rule 19 requires all interfaces to live in `/interface` with an `.interface.ts` suffix.

Evidence:

- `packages/ai/src/embedding/util/build-context-parts.util.ts:3–6` — `ContextPartInterface` inline
- `packages/ai/src/embedding/util/build-merchant-context.util.ts:4–8` — `BuildMerchantContextParamsInterface` inline
- `packages/ai/src/embedding/util/build-comment-context.util.ts:4–7` — `BuildCommentContextParamsInterface` inline
- `packages/ai/src/embedding/util/build-transaction-context.util.ts:6–12` — `BuildTransactionContextParamsInterface` inline

Plan:

1. Move each interface to `packages/ai/src/embedding/interface/<name>.interface.ts`.
2. Import from the new location in the respective util file.
3. No behavioral change.

## P2: Single-Field `SttInvokerInterface` Method Parameter (Rule 44)

`SttInvokerInterface.stream` accepts `options?: { readonly language?: string }`. This is a single-field inline object whose only purpose is to carry `language`. Rule 44 requires passing the field directly.

Evidence:

- `packages/ai/src/voice/interface/stt-invoker.interface.ts:5` — `stream(options?: { readonly language?: string }): Promise<string>`

Plan:

1. Change signature to `stream(language?: string): Promise<string>`.
2. Update all implementations and call sites to pass `language` directly.

## P2: Dead `methodStart` Field Collapses Interface to Single-Field Wrapper (Rules 29/44)

`PrepareSuggestionResultInterface` has two fields: `resolved` and `methodStart`. `methodStart` is set in `prepareSuggestion:181` but is never read at any call site — `suggestCategories`, `suggestTags`, and `suggestComments` all destructure only `resolved`. Removing `methodStart` reduces the interface to a single-field wrapper around `SerializedEmbeddingResultInterface`, which rule 44 says should not exist.

Evidence:

- `packages/ai/src/embedding/interface/prepare-suggestion-result.interface.ts:3–6` — two-field interface
- `packages/ai/src/embedding/service/embedding-suggestion.service.ts:181,189` — `methodStart = Date.now()` set, then returned, never consumed
- `packages/ai/src/embedding/service/embedding-suggestion.service.ts:62,107,146` — all three call sites destructure only `{ resolved }`

Plan:

1. Remove `methodStart` from `PrepareSuggestionResultInterface` and from `prepareSuggestion`'s return statement.
2. Because the interface now wraps a single field `resolved: SerializedEmbeddingResultInterface`, eliminate the wrapper: change `prepareSuggestion` to return `SerializedEmbeddingResultInterface | null` directly and update the three call sites to use the result directly.
3. Delete `prepare-suggestion-result.interface.ts`.

## P2: Magic Blend Weight Should Be `private static readonly` (Rule 39)

`blendMccScores` declares `const mccBlendWeight = 0.7` as a local variable. Rule 39 requires class-owned constants to be `private static readonly` fields so they are visible at the class boundary and not buried inside a method body.

Evidence:

- `packages/ai/src/embedding/service/embedding-suggestion.service.ts:256` — `const mccBlendWeight = 0.7` inside `blendMccScores`

Plan:

1. Add `private static readonly MCC_BLEND_WEIGHT = 0.7` to `EmbeddingSuggestionService`.
2. Replace the local `const` reference with `EmbeddingSuggestionService.MCC_BLEND_WEIGHT`.

## P2: `stripThinkingTags` Manual Loop — Replace With Behavior-Equivalent Regex

`stripThinkingTags` uses a `while` loop with repeated `indexOf` calls to strip `<think>…</think>` blocks. A single regex achieves the same result in one expression with less surface area.

Evidence:

- `packages/ai/src/@generic/util/strip-thinking-tags.util.ts:1–20` — full `while`/`indexOf` loop

Plan:

1. Replace the loop body with `return text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gu, '').trim();`. The `|$` branch preserves current behavior for an unclosed `<think>` tag by dropping the trailing thought text.
2. No interface or signature change — function stays at the same path and export.

## First Slice

Start with voice extraction fixtures:

1. Identify representative multilingual simple-parser phrases.
2. Add a script or approved integration fixture path.
3. Use it to justify any extraction from `VoiceLlmService`.
4. Keep behavior unchanged during the first refactor.

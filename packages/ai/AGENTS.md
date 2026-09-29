# @budgie/ai

Pure TypeScript AI package — no React dependencies. Provides embedding, suggestion, translation, and voice services.

## Architecture

Dual model setup:

- **Chat**: Qwen3 1.7B Q4_K_M — translation, extraction, categorization
- **Embedding**: nomic-embed-text-v2-moe Q8_0 — 768-dimension multilingual embeddings

Invoker interfaces (`ChatInvokerInterface`, `EmbeddingInvokerInterface`, `SttInvokerInterface`) define the Promise-based native contracts. The app implements them. Services wrap invoker calls with `Effect.tryPromise` and fail with `AiInvokeError`; chat calls go through `generateChatResponse`, which calls `chat.interrupt()` on fiber interruption.

## Key Patterns

- **Effect services**: IO methods are `Effect.fn` fields yielding contracts repository Effects (`Db` required). No `throw`; validation is Effect Schema only
- **Inference serialization**: `EmbeddingService` holds a static 1-permit `Semaphore` and a per-instance `effect/Cache` (capacity 50). Failed lookups are invalidated so they are never cached
- **Sequential batch embedding**: llama.rn `context.parallel.embedding()` produces duplicate embeddings — always use sequential
- **Vec search distance threshold**: 0.9 for text, 1.3 for voice context — prevents unrelated high-frequency merchants from drowning results
- **Multilingual embedding model**: nomic-embed-text-v2-moe handles all languages natively — no translation needed before embedding

## Commands

```bash
pnpm build    # Native TypeScript 7 compilation
pnpm clear    # Remove dist/ (needed after deleting source files)
pnpm ts       # Native TypeScript 7 check without emit
pnpm lint     # Oxlint + 13-rule ESLint fallback
```

## File Organization

```
src/
├── @generic/
│   ├── constant/     # Shared embedding constants
│   ├── interface/    # LlmInterface
│   └── util/         # serializeEmbedding, stripThinkingTags
├── embedding/
│   ├── interface/    # Service-specific interfaces
│   ├── service/      # EmbeddingService, EmbeddingSuggestionService
│   └── util/         # buildTransactionContext, containsNonLatin
├── suggestion/
│   ├── constant/     # Translation prompts
│   ├── interface/    # Suggestion status types
│   └── service/      # TranslationLlmService
└── voice/
    ├── constant/     # Audio constants, voice prompts
    ├── interface/    # AITransactionInterface, voice types
    ├── service/      # VoiceLlmService
    └── util/         # calculateRMS, filterTranscriptionTokens, groupVoiceTransactions
```

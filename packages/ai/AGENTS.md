# @budgie/ai

Pure TypeScript AI package — no React dependencies. Provides embedding, suggestion, translation, and voice services.

## Architecture

Dual model setup:

- **Chat**: Qwen3 1.7B Q4_K_M — translation, extraction, categorization
- **Embedding**: nomic-embed-text-v2-moe Q8_0 — 768-dimension multilingual embeddings

`ChatInvoker` and `EmbeddingInvoker` are ports: `Context.Service` keys without a layer, typed by `ChatInvokerInterface` / `EmbeddingInvokerInterface`. The app provides them from its llama.rn services (`ChatService.invokerLayer`, `LocalEmbeddingService.invokerLayer`). Invoker methods return Effects that fail with `AiInvokeError`.

## Key Patterns

- **Effect services**: `TranslationLlmService`, `VoiceLlmService`, `EmbeddingService` and `EmbeddingSuggestionService` are `Context.Service` classes with `static layer`; `make` resolves the ports and contracts repositories, and methods keep `R = Db`. No `throw`; validation is Effect Schema only
- **Inference serialization**: `EmbeddingService` builds a 1-permit `Semaphore` and an `effect/Cache` (capacity 50) in `make`. Failed lookups are invalidated so they are never cached
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

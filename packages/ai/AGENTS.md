# @budgie/ai

Pure TypeScript AI package — no React dependencies. Provides embedding, suggestion, translation, and voice services.

## Architecture

Dual model setup:
- **Chat**: Qwen3 1.7B Q4_K_M — translation, extraction, categorization
- **Embedding**: nomic-embed-text-v2-moe Q8_0 — 768-dimension multilingual embeddings

`LlmInterface` defines the contract. App provides the implementation via `useLlamaLlm`.

## Key Patterns

- **Static inference queue**: `EmbeddingService` uses a promise-chain mutex to serialize embedding calls
- **Sequential batch embedding**: llama.rn `context.parallel.embedding()` produces duplicate embeddings — always use sequential
- **Vec search distance threshold**: 0.9 for text, 1.3 for voice context — prevents unrelated high-frequency merchants from drowning results
- **Multilingual embedding model**: nomic-embed-text-v2-moe handles all languages natively — no translation needed before embedding

## Commands

```bash
yarn build    # TypeScript compilation (tsc)
yarn clear    # Remove dist/ (needed after deleting source files)
yarn ts       # Type check without emit
yarn lint     # ESLint
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

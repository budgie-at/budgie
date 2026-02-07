// @generic - shared interfaces
export type { GenerateOptionsInterface, LlmInterface } from './@generic/interface/llm.interface';

// @generic - constants
export {
    EMBEDDING_BATCH_LIMIT,
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_CONTEXT_MAX_LENGTH,
    EMBEDDING_RECENT_TITLE_COUNT,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_PATTERN_SEARCH_LIMIT,
    EMBEDDING_VEC_SEARCH_LIMIT
} from './@generic/constant/embedding.constant';

// @generic - utils
export { serializeEmbedding } from './@generic/util/serialize-embedding.util';

// embedding - interfaces
export type { EmbeddingPatternRepositoryInterface } from './embedding/interface/embedding-pattern-repository.interface';
export type { EmbeddingRepositoryInterface } from './embedding/interface/embedding-repository.interface';
export type { FindSimilarPatternsParamsInterface } from './embedding/interface/find-similar-patterns-params.interface';
export type { TransactionPatternRepositoryInterface } from './embedding/interface/transaction-pattern-repository.interface';

// embedding - services
export { EmbeddingPatternService } from './embedding/service/embedding-pattern.service';
export { EmbeddingService } from './embedding/service/embedding.service';
export { EmbeddingSuggestionService } from './embedding/service/embedding-suggestion.service';

// embedding - utils
export { buildTransactionContext } from './embedding/util/build-transaction-context.util';

// suggestion - interfaces
export type { SuggestionInternalStatus } from './suggestion/interface/suggestion-internal-status.type';
export type { SuggestionStatus } from './suggestion/interface/suggestion-status.type';
export type { TranslationResultInterface } from './suggestion/interface/translation-result.interface';
export type { UseSuggestionReturnInterface } from './suggestion/interface/use-suggestion-return.interface';

// suggestion - constants
export {
    TAG_GENERATION_SYSTEM_PROMPT,
    TRANSLATION_SYSTEM_PROMPT,
    TRANSLATION_TEMPERATURE
} from './suggestion/constant/translation-prompt.constant';

// suggestion - services
export { TranslationLlmService } from './suggestion/service/translation-llm.service';

// voice - interfaces
export type { AITransactionInterface } from './voice/interface/ai-transaction.interface';

// voice - constants
export {
    AUDIO_LEVEL_MULTIPLIER,
    BUFFER_LENGTH,
    RECORDER_INIT_DELAY_MS,
    SAMPLE_RATE,
    SILENCE_THRESHOLD,
    SILENCE_TIMEOUT_MS
} from './voice/constant/audio.constant';
export { ITEM_EXTRACTION_PROMPT, VOICE_TRANSLATION_PROMPT } from './voice/constant/voice-prompt.constant';

// voice - services
export { VoiceLlmService } from './voice/service/voice-llm.service';
export type { ExtractedVoiceTransactionInterface, GroupedVoiceTransactionInterface } from './voice/service/voice-llm.service';
export { groupVoiceTransactions } from './voice/service/voice-llm.service';

// voice - utils
export { calculateRMS } from './voice/util/calculate-rms.util';
export { filterTranscriptionTokens } from './voice/util/filter-transcription-tokens.util';
export { findAccountByCurrency } from './voice/util/find-account-by-currency.util';

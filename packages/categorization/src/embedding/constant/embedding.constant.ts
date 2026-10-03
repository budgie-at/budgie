/* oxlint-disable lingui/no-unlocalized-strings -- Model prompt prefixes are not user-facing strings */
export const EMBEDDING_MODEL_URL = 'https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf';
export const EMBEDDING_MODEL_FILENAME = 'embeddinggemma-300M-Q8_0.gguf';
export const EMBEDDING_CONTEXT_SIZE = 512;
export const EMBEDDING_DOCUMENT_PREFIX = 'title: none | text: ';
export const EMBEDDING_QUERY_PREFIX = 'task: search result | query: ';
export const EMBEDDING_DOCUMENT_FORMAT = 'merchant-text';
export const EMBEDDING_CATEGORY_SUGGESTION_LIMIT = 3;
export const EMBEDDING_TAG_SUGGESTION_LIMIT = 3;
export const EMBEDDING_COMMENT_SUGGESTION_LIMIT = 3;
export const EMBEDDING_VEC_OVERSAMPLE_LIMIT = 50;
export const EMBEDDING_VEC_DISTANCE_THRESHOLD = 1.0;
export const EMBEDDING_AUTO_APPLY_DISTANCE_THRESHOLD = 0.8;
export const EMBEDDING_AUTO_APPLY_MIN_CONFIDENCE = 0.6;
export const EMBEDDING_CROSS_CATEGORY_TAG_DISTANCE_THRESHOLD = 0.7;
export const EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD = 1.3;
export const EMBEDDING_DIMENSIONS = 768;

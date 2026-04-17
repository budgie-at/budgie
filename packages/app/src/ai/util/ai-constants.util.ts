/* eslint-disable lingui/no-unlocalized-strings -- Model URLs and filenames are not user-facing strings */
export const CHAT_MODEL_URL = 'https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf';
export const CHAT_MODEL_FILENAME = 'Qwen3-1.7B-Q4_K_M.gguf';
export const CHAT_CONTEXT_SIZE = 2048;

export const EMBEDDING_MODEL_URL = 'https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe-GGUF/resolve/main/nomic-embed-text-v2-moe.Q8_0.gguf';
export const EMBEDDING_MODEL_FILENAME = 'nomic-embed-text-v2-moe.Q8_0.gguf';
export const EMBEDDING_CONTEXT_SIZE = 512;

export const STOP_TOKENS = ['<|im_end|>', '<|endoftext|>'];
export const DEFAULT_MAX_TOKENS = 64;
export const GPU_LAYERS = 99;
export const GENERATION_CONFIG = { temperature: 0.7, top_k: 20, top_p: 0.8 };
export const BACKGROUND_RELEASE_DELAY_MS = 30_000;

const CHAT_MODEL_SIZE_MB = 1110;
const EMBEDDING_MODEL_SIZE_MB = 488;
const TOTAL_MODEL_SIZE_MB = CHAT_MODEL_SIZE_MB + EMBEDDING_MODEL_SIZE_MB;
export const CHAT_DOWNLOAD_WEIGHT = CHAT_MODEL_SIZE_MB / TOTAL_MODEL_SIZE_MB;
export const EMBEDDING_DOWNLOAD_WEIGHT = EMBEDDING_MODEL_SIZE_MB / TOTAL_MODEL_SIZE_MB;

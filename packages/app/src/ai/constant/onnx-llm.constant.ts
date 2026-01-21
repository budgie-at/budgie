/* eslint-disable lingui/no-unlocalized-strings */
export const LFM25_MODEL_ID = 'LiquidAI/LFM2.5-1.2B-Instruct';
export const LFM25_MODEL_PATH = 'lfm25-1.2b-q4.onnx';

export const LFM25_SPECIAL_TOKENS = {
    bosToken: 0,
    eosToken: 2,
    padToken: 1
} as const;

export const LFM25_CHAT_MARKERS = {
    imStart: '<|im_start|>',
    imEnd: '<|im_end|>'
} as const;

export const LFM25_GENERATION_CONFIG = {
    maxNewTokens: 256,
    temperature: 0.05,
    topK: 50,
    repetitionPenalty: 1.05
} as const;

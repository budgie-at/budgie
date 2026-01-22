/* eslint-disable lingui/no-unlocalized-strings */
export const LFM25_MODEL_ID = 'LiquidAI/LFM2.5-1.2B-Instruct-ONNX';
export const LFM25_MODEL_PATH = 'model_q4.onnx';

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
    topP: 0.9,
    repetitionPenalty: 1.05
} as const;

export const LFM25_DOWNLOAD_CONFIG = {
    modelFilename: 'model_q4.onnx',
    modelDataFilename: 'model_q4.onnx_data',
    directory: 'budgie-ai',
    hfBaseUrl: 'https://huggingface.co',
    modelFileWeight: 0.01,
    dataFileWeight: 0.99,
    storageKeys: {
        downloadState: 'lfm25_download_state',
        fileSizes: 'lfm25_file_sizes'
    }
} as const;

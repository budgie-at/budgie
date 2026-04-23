import { LlamaContext, initLlama } from 'llama.rn';

import { isDefined } from '@rnw-community/shared';

import { aiLog } from '../utils/ai-log.util';

import { GPU_LAYERS } from './ai-constants.util';
import { downloadModel } from './download-model.util';

interface LoadLlamaContextParamsInterface {
    readonly domain: string;
    readonly modelUrl: string;
    readonly modelFilename: string;
    readonly contextSize: number;
    readonly embedding: boolean;
    readonly poolingType?: 'mean' | 'none' | 'cls' | 'last';
    readonly onDownloadBegin: () => void;
    readonly onDownloadProgress: (progress: number) => void;
    readonly onInitBegin: () => void;
}

export const loadLlamaContext = async (params: LoadLlamaContextParamsInterface): Promise<LlamaContext> => {
    params.onDownloadBegin();
    aiLog(`${params.domain}:download:begin`, { url: params.modelUrl, filename: params.modelFilename });
    const downloadStarted = Date.now();
    const modelPath = await downloadModel(params.modelUrl, params.modelFilename, params.onDownloadProgress);
    aiLog(`${params.domain}:download:complete`, { path: modelPath, durationMs: Date.now() - downloadStarted });

    params.onInitBegin();
    aiLog(`${params.domain}:init:begin`);
    const initStarted = Date.now();
    const context = await initLlama({
        model: modelPath,
        n_ctx: params.contextSize,
        n_gpu_layers: GPU_LAYERS,
        use_mlock: true,
        embedding: params.embedding,
        ...(isDefined(params.poolingType) && { pooling_type: params.poolingType })
    });
    aiLog(`${params.domain}:init:complete`, { durationMs: Date.now() - initStarted });

    return context;
};

import { InferenceSession, Tensor } from 'onnxruntime-react-native';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

type OnnxSession = InferenceSession;

interface GenerationConfig {
    maxNewTokens: number;
    temperature: number;
    topK: number;
    repetitionPenalty: number;
    eosTokenId: number;
}

interface Lfm25InferenceInterface {
    session: OnnxSession | null;
    isLoaded: boolean;
    loadProgress: number;
    error: string | null;
    load: (modelPath: string) => Promise<void>;
    generate: (inputIds: number[], config: GenerationConfig) => Promise<number[]>;
    interrupt: () => void;
}

let cachedSession: OnnxSession | null = null;
let loadingProgress = 0;
let loadError: string | null = null;
let isInterrupted = false;

const load = async (modelPath: string): Promise<void> => {
    if (isDefined(cachedSession)) {
        return;
    }

    try {
        loadingProgress = 0;
        loadError = null;

        cachedSession = await InferenceSession.create(modelPath, {
            executionProviders: ['cpu'],
            graphOptimizationLevel: 'all'
        });

        loadingProgress = 100;
    } catch (e: unknown) {
        loadError = getErrorMessage(e);
        loadingProgress = 0;
        throw e;
    }
};

const softmax = (logits: Float32Array, temperature: number): Float32Array => {
    const scaled = new Float32Array(logits.length);
    let maxVal = -Infinity;

    for (let i = 0; i < logits.length; i++) {
        scaled[i] = logits[i] / temperature;
        if (scaled[i] > maxVal) {
            maxVal = scaled[i];
        }
    }

    let sumExp = 0;
    for (let i = 0; i < scaled.length; i++) {
        scaled[i] = Math.exp(scaled[i] - maxVal);
        sumExp += scaled[i];
    }

    for (let i = 0; i < scaled.length; i++) {
        scaled[i] /= sumExp;
    }

    return scaled;
};

const applyRepetitionPenalty = (logits: Float32Array, generatedTokens: number[], penalty: number): void => {
    const seen = new Set(generatedTokens);
    for (const tokenId of seen) {
        if (tokenId < logits.length) {
            if (logits[tokenId] > 0) {
                logits[tokenId] /= penalty;
            } else {
                logits[tokenId] *= penalty;
            }
        }
    }
};

const sampleTopK = (probs: Float32Array, topK: number): number => {
    const indexed = Array.from(probs).map((p, i) => ({ prob: p, idx: i }));
    indexed.sort((a, b) => b.prob - a.prob);

    const topKItems = indexed.slice(0, topK);
    const topKSum = topKItems.reduce((sum, item) => sum + item.prob, 0);

    const random = Math.random() * topKSum;
    let cumSum = 0;

    for (const item of topKItems) {
        cumSum += item.prob;
        if (random <= cumSum) {
            return item.idx;
        }
    }

    return topKItems[0].idx;
};

const generate = async (inputIds: number[], config: GenerationConfig): Promise<number[]> => {
    if (!isDefined(cachedSession)) {
        throw new Error('Model not loaded');
    }

    isInterrupted = false;
    const generatedTokens: number[] = [];
    let currentIds = [...inputIds];

    for (let i = 0; i < config.maxNewTokens; i++) {
        if (isInterrupted) {
            break;
        }

        const inputTensor = new Tensor('int64', BigInt64Array.from(currentIds.map(BigInt)), [1, currentIds.length]);

        const attentionMask = new Tensor('int64', BigInt64Array.from(currentIds.map(() => BigInt(1))), [1, currentIds.length]);

        const feeds: Record<string, Tensor> = {
            input_ids: inputTensor,
            attention_mask: attentionMask
        };

        const results = await cachedSession.run(feeds);
        const logitsOutput = results.logits;

        if (!isDefined(logitsOutput)) {
            throw new Error('No logits output from model');
        }

        const logitsData = logitsOutput.data as Float32Array;
        const vocabSize = logitsOutput.dims[2];
        const lastTokenLogits = new Float32Array(vocabSize);

        const offset = (currentIds.length - 1) * vocabSize;
        for (let j = 0; j < vocabSize; j++) {
            lastTokenLogits[j] = logitsData[offset + j];
        }

        applyRepetitionPenalty(lastTokenLogits, [...inputIds, ...generatedTokens], config.repetitionPenalty);

        const probs = softmax(lastTokenLogits, config.temperature);
        const nextToken = sampleTopK(probs, config.topK);

        if (nextToken === config.eosTokenId) {
            break;
        }

        generatedTokens.push(nextToken);
        currentIds = [...inputIds, ...generatedTokens];
    }

    return generatedTokens;
};

const interrupt = (): void => {
    isInterrupted = true;
};

export const lfm25InferenceService: Lfm25InferenceInterface = {
    get session() {
        return cachedSession;
    },
    get isLoaded() {
        return isDefined(cachedSession);
    },
    get loadProgress() {
        return loadingProgress;
    },
    get error() {
        return loadError;
    },
    load,
    generate,
    interrupt
};

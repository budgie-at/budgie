/* eslint-disable no-await-in-loop, max-statements, no-plusplus, @typescript-eslint/no-unnecessary-condition, lingui/no-unlocalized-strings, no-implicit-coercion, prefer-destructuring, require-unicode-regexp, max-lines */
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { GenerationConfigInterface } from '../interface/generation-config.interface';

type OnnxSession = InferenceSession;

const MODEL_CONFIG = {
    hiddenSize: 2048,
    numKvHeads: 8,
    convCacheLength: 3,
    layerTypes: [
        'conv',
        'conv',
        'full_attention',
        'conv',
        'conv',
        'full_attention',
        'conv',
        'conv',
        'full_attention',
        'conv',
        'full_attention',
        'conv',
        'full_attention',
        'conv',
        'full_attention',
        'conv'
    ] as const
} as const;

interface KvCacheInterface {
    convStates: Map<string, Tensor>;
    kvStates: Map<string, Tensor>;
}

class Lfm25InferenceService {
    private session: OnnxSession | null = null;
    private loadProgress = 0;
    private loadError: string | null = null;
    private isInterrupted = false;
    private kvCache: KvCacheInterface | null = null;
    private pastSeqLength = 0;

    get isLoaded(): boolean {
        return isDefined(this.session);
    }

    get progress(): number {
        return this.loadProgress;
    }

    get error(): string | null {
        return this.loadError;
    }

    async load(modelPath: string): Promise<void> {
        if (isDefined(this.session)) {
            return;
        }

        try {
            this.loadProgress = 0;
            this.loadError = null;

            this.session = await InferenceSession.create(modelPath, {
                executionProviders: ['cpu'],
                graphOptimizationLevel: 'all'
            });

            this.loadProgress = 100;
        } catch (err: unknown) {
            this.loadError = getErrorMessage(err);
            this.loadProgress = 0;
            throw err;
        }
    }

    async generate(inputIds: number[], config: GenerationConfigInterface): Promise<number[]> {
        if (!isDefined(this.session)) {
            throw new Error('Model not loaded');
        }

        this.isInterrupted = false;
        this.resetCache();

        const generatedTokens: number[] = [];
        let currentInputIds = inputIds;

        for (let idx = 0; idx < config.maxNewTokens; idx++) {
            if (this.isInterrupted) {
                break;
            }

            const nextToken = await this.generateNextToken(this.session, currentInputIds, config);

            if (nextToken === config.eosTokenId) {
                break;
            }

            generatedTokens.push(nextToken);
            currentInputIds = [nextToken];
        }

        return generatedTokens;
    }

    interrupt(): void {
        this.isInterrupted = true;
    }

    private resetCache(): void {
        this.kvCache = this.initializeEmptyCache();
        this.pastSeqLength = 0;
    }

    private initializeEmptyCache(): KvCacheInterface {
        const convStates = new Map<string, Tensor>();
        const kvStates = new Map<string, Tensor>();

        const { hiddenSize, numKvHeads, convCacheLength } = MODEL_CONFIG;
        const headDim = hiddenSize / 32;

        const convIndices = [0, 1, 3, 4, 6, 7, 9, 11, 13, 15];
        const attnIndices = [2, 5, 8, 10, 12, 14];

        for (const convIdx of convIndices) {
            const convTensor = new Tensor('float32', new Float32Array(1 * hiddenSize * convCacheLength).fill(0), [
                1,
                hiddenSize,
                convCacheLength
            ]);
            convStates.set(`past_conv.${convIdx}`, convTensor);
        }

        for (const attnIdx of attnIndices) {
            const keyTensor = new Tensor('float32', new Float32Array(0), [1, numKvHeads, 0, headDim]);
            const valueTensor = new Tensor('float32', new Float32Array(0), [1, numKvHeads, 0, headDim]);
            kvStates.set(`past_key_values.${attnIdx}.key`, keyTensor);
            kvStates.set(`past_key_values.${attnIdx}.value`, valueTensor);
        }

        return { convStates, kvStates };
    }

    private async generateNextToken(session: OnnxSession, inputTokens: number[], config: GenerationConfigInterface): Promise<number> {
        const seqLength = inputTokens.length;
        const inputTensor = new Tensor('int64', BigInt64Array.from(inputTokens.map(BigInt)), [1, seqLength]);
        const attentionMask = new Tensor('int64', BigInt64Array.from(Array(this.pastSeqLength + seqLength).fill(BigInt(1))), [
            1,
            this.pastSeqLength + seqLength
        ]);
        const positionIds = new Tensor('int64', BigInt64Array.from(inputTokens.map((_, idx) => BigInt(this.pastSeqLength + idx))), [
            1,
            seqLength
        ]);

        const feeds: Record<string, Tensor> = {
            input_ids: inputTensor,
            attention_mask: attentionMask,
            position_ids: positionIds
        };

        if (isDefined(this.kvCache)) {
            for (const [key, tensor] of this.kvCache.convStates) {
                feeds[key] = tensor;
            }
            for (const [key, tensor] of this.kvCache.kvStates) {
                feeds[key] = tensor;
            }
        }

        const results = await session.run(feeds);

        this.updateCache(results);
        this.pastSeqLength += seqLength;

        const logitsKey = 'logits';
        const logitsOutput = results[logitsKey];

        if (!isDefined(logitsOutput)) {
            throw new Error('No logits output from model');
        }

        const logitsData = logitsOutput.data as Float32Array;
        const vocabSize = logitsOutput.dims[2];
        const lastTokenLogits = new Float32Array(vocabSize);

        const offset = (seqLength - 1) * vocabSize;
        for (let jdx = 0; jdx < vocabSize; jdx++) {
            lastTokenLogits[jdx] = logitsData[offset + jdx];
        }

        this.applyRepetitionPenalty(lastTokenLogits, inputTokens, config.repetitionPenalty);

        const probs = this.softmax(lastTokenLogits, config.temperature);

        return this.sampleTopKTopP(probs, config.topK, config.topP);
    }

    private updateCache(results: InferenceSession.OnnxValueMapType): void {
        if (!isDefined(this.kvCache)) {
            return;
        }

        for (const [key] of this.kvCache.convStates) {
            const presentKey = key.replace('past_conv', 'present_conv');
            const presentTensor = results[presentKey] as Tensor | undefined;

            if (isDefined(presentTensor)) {
                this.kvCache.convStates.set(key, presentTensor);
            }
        }

        for (const [key] of this.kvCache.kvStates) {
            const match = key.match(/past_key_values\.(\d+)\.(key|value)/);

            if (isDefined(match)) {
                const layerIdx = match[1];
                const kvType = match[2];
                const presentKey = `present.${layerIdx}.${kvType}`;
                const presentTensor = results[presentKey] as Tensor | undefined;

                if (isDefined(presentTensor)) {
                    this.kvCache.kvStates.set(key, presentTensor);
                }
            }
        }
    }

    private softmax(logits: Float32Array, temperature: number): Float32Array {
        const scaled = new Float32Array(logits.length);
        let maxVal = -Infinity;

        for (let idx = 0; idx < logits.length; idx++) {
            scaled[idx] = logits[idx] / temperature;
            if (scaled[idx] > maxVal) {
                maxVal = scaled[idx];
            }
        }

        let sumExp = 0;
        for (let idx = 0; idx < scaled.length; idx++) {
            scaled[idx] = Math.exp(scaled[idx] - maxVal);
            sumExp += scaled[idx];
        }

        for (let idx = 0; idx < scaled.length; idx++) {
            scaled[idx] /= sumExp;
        }

        return scaled;
    }

    private applyRepetitionPenalty(logits: Float32Array, generatedTokens: number[], penalty: number): void {
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
    }

    private sampleTopKTopP(probs: Float32Array, topK: number, topP: number): number {
        const indexed = Array.from(probs).map((prob, idx) => ({ prob, idx }));
        indexed.sort((first, second) => second.prob - first.prob);

        const topKItems = indexed.slice(0, topK);
        const filteredItems = this.applyTopP(topKItems, topP);

        const totalProb = filteredItems.reduce((sum, item) => sum + item.prob, 0);
        const random = Math.random() * totalProb;
        let cumSum = 0;

        for (const item of filteredItems) {
            cumSum += item.prob;
            if (random <= cumSum) {
                return item.idx;
            }
        }

        return filteredItems[0].idx;
    }

    private applyTopP(items: Array<{ prob: number; idx: number }>, topP: number): Array<{ prob: number; idx: number }> {
        let cumProb = 0;
        const result: Array<{ prob: number; idx: number }> = [];

        for (const item of items) {
            result.push(item);
            cumProb += item.prob;

            if (cumProb >= topP) {
                break;
            }
        }

        return result;
    }
}

export const lfm25InferenceService = new Lfm25InferenceService();

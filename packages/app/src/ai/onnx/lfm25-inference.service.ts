/* eslint-disable no-await-in-loop, max-statements, no-plusplus, @typescript-eslint/no-unnecessary-condition, lingui/no-unlocalized-strings */
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { GenerationConfigInterface } from '../interface/generation-config.interface';

type OnnxSession = InferenceSession;

class Lfm25InferenceService {
    private session: OnnxSession | null = null;
    private loadProgress = 0;
    private loadError: string | null = null;
    private isInterrupted = false;

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
        const generatedTokens: number[] = [];
        let currentIds = [...inputIds];

        for (let idx = 0; idx < config.maxNewTokens; idx++) {
            if (this.isInterrupted) {
                break;
            }

            const allTokens = [...inputIds, ...generatedTokens];
            const nextToken = await this.generateNextToken(this.session, currentIds, allTokens, config);

            if (nextToken === config.eosTokenId) {
                break;
            }

            generatedTokens.push(nextToken);
            currentIds = [...allTokens, nextToken];
        }

        return generatedTokens;
    }

    interrupt(): void {
        this.isInterrupted = true;
    }

    private async generateNextToken(
        session: OnnxSession,
        currentIds: number[],
        allTokens: number[],
        config: GenerationConfigInterface
    ): Promise<number> {
        const inputTensor = new Tensor('int64', BigInt64Array.from(currentIds.map(BigInt)), [1, currentIds.length]);
        const attentionMask = new Tensor('int64', BigInt64Array.from(currentIds.map(() => BigInt(1))), [1, currentIds.length]);

        const feeds: Record<string, Tensor> = {
            input_ids: inputTensor,
            attention_mask: attentionMask
        };

        const results = await session.run(feeds);
        const logitsKey = 'logits';
        const logitsOutput = results[logitsKey];

        if (!isDefined(logitsOutput)) {
            throw new Error('No logits output from model');
        }

        const logitsData = logitsOutput.data as Float32Array;
        const [vocabSize] = [logitsOutput.dims[2]];
        const lastTokenLogits = new Float32Array(vocabSize);

        const offset = (currentIds.length - 1) * vocabSize;
        for (let jdx = 0; jdx < vocabSize; jdx++) {
            lastTokenLogits[jdx] = logitsData[offset + jdx];
        }

        this.applyRepetitionPenalty(lastTokenLogits, allTokens, config.repetitionPenalty);

        const probs = this.softmax(lastTokenLogits, config.temperature);

        return this.sampleTopK(probs, config.topK);
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

    private sampleTopK(probs: Float32Array, topK: number): number {
        const indexed = Array.from(probs).map((prob, idx) => ({ prob, idx }));
        indexed.sort((first, second) => second.prob - first.prob);

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
    }
}

export const lfm25InferenceService = new Lfm25InferenceService();

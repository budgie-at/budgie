import { LlamaContext } from 'llama.rn';
import { type RefObject } from 'react';

import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AiModeEnum } from '../enum/ai-mode.enum';
import { isNativeCallSafe } from '../utils/is-native-call-safe.util';

interface UseAiEmbeddingParamsInterface {
    readonly embeddingContextRef: RefObject<LlamaContext | null>;
    readonly modeRef: RefObject<AiModeEnum>;
}

interface UseAiEmbeddingResultInterface {
    readonly embedding: (text: string) => Promise<number[]>;
    readonly batchEmbedding: (texts: string[]) => Promise<Map<string, number[]>>;
}

export const useAiEmbedding = ({ embeddingContextRef, modeRef }: UseAiEmbeddingParamsInterface): UseAiEmbeddingResultInterface => {
    const embedding = async (text: string): Promise<number[]> => {
        if (!isNativeCallSafe(modeRef.current)) {
            return [];
        }
        if (!isDefined(embeddingContextRef.current)) {
            return [];
        }
        try {
            const result = await embeddingContextRef.current.embedding(text);

            return result.embedding;
        } catch {
            return [];
        }
    };

    const batchEmbedding = async (texts: string[]): Promise<Map<string, number[]>> => {
        if (!isNativeCallSafe(modeRef.current)) {
            return new Map();
        }
        const context = embeddingContextRef.current;
        if (!isDefined(context) || !isNotEmptyArray(texts)) {
            return new Map();
        }

        const results = new Map<string, number[]>();
        /* eslint-disable no-await-in-loop -- Sequential batch embedding */
        for (const text of texts) {
            if (!isNativeCallSafe(modeRef.current)) {
                break;
            }
            try {
                const result = await context.embedding(text);
                if (isNotEmptyArray(result.embedding)) {
                    results.set(text, result.embedding);
                }
            } catch {
                emptyFn();
            }
        }
        /* eslint-enable no-await-in-loop */

        return results;
    };

    return { embedding, batchEmbedding };
};

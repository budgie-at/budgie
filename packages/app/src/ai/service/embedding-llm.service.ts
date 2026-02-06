import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_BATCH_LIMIT } from '../constant/embedding.constant';
import { LlmInterface } from '../context/llm.context';

export class EmbeddingLlmService {
    constructor(private readonly llm: LlmInterface) {}

    async generateEmbedding(text: string): Promise<Float32Array | null> {
        const rawEmbedding = await this.llm.embedding(text);

        if (!isNotEmptyArray(rawEmbedding)) {
            return null;
        }

        return new Float32Array(rawEmbedding);
    }

    async generateEmbeddings(texts: string[]): Promise<Map<string, Float32Array>> {
        const results = new Map<string, Float32Array>();
        const batch = texts.slice(0, EMBEDDING_BATCH_LIMIT);

        for (const text of batch) {
            const embeddingResult = await this.generateEmbedding(text); // eslint-disable-line no-await-in-loop -- Sequential to avoid overwhelming LLM

            if (isDefined(embeddingResult)) {
                results.set(text, embeddingResult);
            }
        }

        return results;
    }

    isAvailable(): boolean {
        return this.llm.isReady;
    }
}

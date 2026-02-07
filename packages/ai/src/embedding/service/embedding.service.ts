import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_BATCH_LIMIT } from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';
import { CONTEXT_TRANSLATION_SYSTEM_PROMPT } from '../constant/context-translation-prompt.constant';
import { containsNonLatin } from '../util/contains-non-latin.util';

export class EmbeddingService {
    constructor(private readonly llm: LlmInterface) {}

    async generateEmbedding(text: string): Promise<Float32Array | null> {
        const rawEmbedding = await this.llm.embedding(text);

        if (!isNotEmptyArray(rawEmbedding)) {
            return null;
        }

        return new Float32Array(rawEmbedding);
    }

    async generateEmbeddingWithTranslation(originalText: string): Promise<Float32Array | null> {
        const textToEmbed = containsNonLatin(originalText) ? await this.translateContext(originalText) : originalText;

        return this.generateEmbedding(textToEmbed);
    }

    async generateEmbeddings(texts: string[]): Promise<Map<string, Float32Array>> {
        const results = new Map<string, Float32Array>();
        const batch = texts.slice(0, EMBEDDING_BATCH_LIMIT);

        for (const text of batch) {
            const embeddingResult = await this.generateEmbeddingWithTranslation(text); // eslint-disable-line no-await-in-loop -- Sequential to avoid overwhelming LLM

            if (isDefined(embeddingResult)) {
                results.set(text, embeddingResult);
            }
        }

        return results;
    }

    isAvailable(): boolean {
        return this.llm.isReady;
    }

    private async translateContext(text: string): Promise<string> {
        try {
            const translated = await this.llm.generate(CONTEXT_TRANSLATION_SYSTEM_PROMPT, text, { temperature: 0.3 });

            return translated.trim();
        } catch {
            return text;
        }
    }
}

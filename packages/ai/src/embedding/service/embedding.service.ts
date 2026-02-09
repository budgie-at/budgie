import { isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_BATCH_LIMIT } from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';
import { CONTEXT_TRANSLATION_SYSTEM_PROMPT } from '../constant/context-translation-prompt.constant';
import { containsNonLatin } from '../util/contains-non-latin.util';

export class EmbeddingService {
    constructor(private readonly llm: LlmInterface) {}

    async generateEmbedding(text: string): Promise<Float32Array | null> {
        const start = performance.now();
        const rawEmbedding = await this.llm.embedding(text);
        console.log(`[EmbedSvc] llm.embedding() done in ${(performance.now() - start).toFixed(0)}ms, dims=${rawEmbedding.length}`); // eslint-disable-line no-console

        if (!isNotEmptyArray(rawEmbedding)) {
            return null;
        }

        return new Float32Array(rawEmbedding);
    }

    async generateEmbeddingWithTranslation(originalText: string): Promise<Float32Array | null> {
        const start = performance.now();
        const needsTranslation = containsNonLatin(originalText);
        console.log(`[EmbedSvc] generateEmbeddingWithTranslation needsTranslation=${needsTranslation} text="${originalText}"`); // eslint-disable-line no-console
        const textToEmbed = needsTranslation ? await this.translateContext(originalText) : originalText;
        console.log(`[EmbedSvc] translation done in ${(performance.now() - start).toFixed(0)}ms, result="${textToEmbed}"`); // eslint-disable-line no-console

        return this.generateEmbedding(textToEmbed);
    }

    async generateEmbeddings(texts: string[]): Promise<Map<string, Float32Array>> {
        const batch = texts.slice(0, EMBEDDING_BATCH_LIMIT);
        const rawResults = await this.llm.batchEmbedding(batch);

        const results = new Map<string, Float32Array>();
        for (const [text, embedding] of rawResults) {
            results.set(text, new Float32Array(embedding));
        }

        return results;
    }

    isAvailable(): boolean {
        return this.llm.isReady;
    }

    private async translateContext(text: string): Promise<string> {
        try {
            const start = performance.now();
            console.log(`[EmbedSvc] translateContext START text="${text}"`); // eslint-disable-line no-console
            const translated = await this.llm.generate(CONTEXT_TRANSLATION_SYSTEM_PROMPT, text, { temperature: 0.3 });
            console.log(`[EmbedSvc] translateContext done in ${(performance.now() - start).toFixed(0)}ms, result="${translated.trim()}"`); // eslint-disable-line no-console

            return translated.trim();
        } catch {
            return text;
        }
    }
}

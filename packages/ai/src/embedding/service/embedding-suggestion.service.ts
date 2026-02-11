import { CategoryEntityInterface, TagEntityInterface, TitleEmbeddingRepository } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_COMMENT_SUGGESTION_LIMIT,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_DISTANCE_THRESHOLD,
    EMBEDDING_VEC_OVERSAMPLE_LIMIT,
    EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD
} from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';
import { serializeEmbedding } from '../../@generic/util/serialize-embedding.util';
import { buildTransactionContext } from '../util/build-transaction-context.util';

import { EmbeddingService } from './embedding.service';

interface SuggestionContextInterface {
    readonly context: string;
    readonly distanceThreshold: number;
}

export class EmbeddingSuggestionService {
    constructor(private readonly repository: TitleEmbeddingRepository) {}

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit to avoid extra context-building calls in hooks
    async suggestCategories(
        llm: LlmInterface,
        categories: CategoryEntityInterface[],
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<CategoryEntityInterface[]> {
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        const { context, distanceThreshold } = suggestionContext;
        console.log(`[EmbSuggest] suggestCategories context="${context}" threshold=${distanceThreshold}`); // eslint-disable-line no-console

        const serialized = await this.generateSerializedEmbedding(context, llm);

        if (!isDefined(serialized)) {
            console.log('[EmbSuggest] suggestCategories: embedding generation failed, returning []'); // eslint-disable-line no-console

            return [];
        }

        console.log(`[EmbSuggest] embedding generated, ${serialized.byteLength} bytes, querying vec...`); // eslint-disable-line no-console

        const categoryCounts = await this.repository.findSimilarCategories(
            serialized,
            EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold,
            EMBEDDING_CATEGORY_SUGGESTION_LIMIT
        );

        console.log(`[EmbSuggest] vec returned ${categoryCounts.length} categories: ${JSON.stringify(categoryCounts)}`); // eslint-disable-line no-console

        return categoryCounts.map(row => categories.find(category => category.id === row.categoryId)).filter(isDefined);
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit to avoid extra context-building calls in hooks
    async suggestTags(
        llm: LlmInterface,
        allTags: TagEntityInterface[],
        categoryId: number,
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<TagEntityInterface[]> {
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        const { context, distanceThreshold } = suggestionContext;
        const serialized = await this.generateSerializedEmbedding(context, llm);

        if (!isDefined(serialized)) {
            return [];
        }

        const tagCounts = await this.repository.findSimilarTags(serialized, {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold,
            categoryId,
            tagLimit: EMBEDDING_TAG_SUGGESTION_LIMIT
        });

        return tagCounts.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit to avoid extra context-building calls in hooks
    async suggestComments(
        llm: LlmInterface,
        categoryId: number,
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<string[]> {
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        const { context, distanceThreshold } = suggestionContext;
        const serialized = await this.generateSerializedEmbedding(context, llm);

        if (!isDefined(serialized)) {
            return [];
        }

        const commentCounts = await this.repository.findSimilarComments(serialized, {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold,
            categoryId,
            commentLimit: EMBEDDING_COMMENT_SUGGESTION_LIMIT
        });

        return commentCounts.map(row => row.comment).filter(isNotEmptyString);
    }

    private resolveSuggestionContext(
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): SuggestionContextInterface {
        const hasVoiceContext = isNotEmptyString(aiContext);
        const context = hasVoiceContext ? aiContext : buildTransactionContext(transactionTitle, mccDescription, comment);
        const distanceThreshold = hasVoiceContext ? EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD : EMBEDDING_VEC_DISTANCE_THRESHOLD;

        return { context, distanceThreshold };
    }

    private async generateSerializedEmbedding(context: string, llm: LlmInterface): Promise<Uint8Array | null> {
        const service = new EmbeddingService(llm);
        const queryEmbedding = await service.generateEmbeddingWithTranslation(context);

        if (!isDefined(queryEmbedding) || queryEmbedding.length === 0) {
            return null;
        }

        return serializeEmbedding(queryEmbedding);
    }
}

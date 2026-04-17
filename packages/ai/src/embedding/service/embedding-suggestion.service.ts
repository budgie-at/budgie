import {
    CategoryEntityInterface,
    CategoryScoreResultInterface,
    SimilarTagsParamsInterface,
    TagEntityInterface,
    TagScoreResultInterface
} from '@budgie/contracts';

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
import { aiSuggestLog } from '../../@generic/util/ai-suggest-log.util';
import { serializeEmbedding } from '../../@generic/util/serialize-embedding.util';
import { EmbeddingSuggestionRepositoriesInterface } from '../interface/embedding-suggestion-repositories.interface';
import { SuggestionContextInterface } from '../interface/suggestion-context.interface';
import { buildTransactionContext } from '../util/build-transaction-context.util';

import { EmbeddingService } from './embedding.service';

export class EmbeddingSuggestionService {
    constructor(private readonly repositories: EmbeddingSuggestionRepositoriesInterface) {}

     
    /* eslint-disable-next-line @typescript-eslint/max-params, max-statements -- Keep full context fields explicit; instrumented temporarily */
    async suggestCategories(
        llm: LlmInterface,
        categories: CategoryEntityInterface[],
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<CategoryEntityInterface[]> {
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        aiSuggestLog('svc:suggestCategories:context', {
            context: suggestionContext.context,
            distanceThreshold: suggestionContext.distanceThreshold
        });
        const resolved = await this.resolveSerializedEmbedding(llm, suggestionContext);

        if (!isDefined(resolved)) {
            aiSuggestLog('svc:suggestCategories:no-embedding', { context: suggestionContext.context });

            return [];
        }

        aiSuggestLog('svc:suggestCategories:embedded', {
            serializedBytes: resolved.serialized.length,
            distanceThreshold: resolved.distanceThreshold
        });

        const [merchantResults, commentResults] = await Promise.all([
            this.repositories.merchant.findSimilarCategories(
                resolved.serialized,
                EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                resolved.distanceThreshold,
                EMBEDDING_CATEGORY_SUGGESTION_LIMIT
            ),
            this.repositories.comment.findSimilarCategories(
                resolved.serialized,
                EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                resolved.distanceThreshold,
                EMBEDDING_CATEGORY_SUGGESTION_LIMIT
            )
        ]);

        aiSuggestLog('svc:suggestCategories:repoResults', {
            merchantCount: merchantResults.length,
            commentCount: commentResults.length,
            merchantRows: merchantResults.map(row => ({ categoryId: row.categoryId, score: row.score })),
            commentRows: commentResults.map(row => ({ categoryId: row.categoryId, score: row.score }))
        });

        const merged = this.mergeCategoryScores(merchantResults, commentResults);
        const topCategories = merged.slice(0, EMBEDDING_CATEGORY_SUGGESTION_LIMIT);
        const resolvedCategories = topCategories.map(row => categories.find(category => category.id === row.categoryId)).filter(isDefined);
        aiSuggestLog('svc:suggestCategories:final', {
            topCount: topCategories.length,
            resolvedCount: resolvedCategories.length,
            topCategoryIds: resolvedCategories.map(category => category.id)
        });

        return resolvedCategories;
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
        const resolved = await this.resolveSerializedEmbedding(llm, suggestionContext);

        if (!isDefined(resolved)) {
            return [];
        }

        const tagParams: SimilarTagsParamsInterface = {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold: resolved.distanceThreshold,
            categoryId,
            tagLimit: EMBEDDING_TAG_SUGGESTION_LIMIT
        };

        const [merchantResults, commentResults] = await Promise.all([
            this.repositories.merchant.findSimilarTags(resolved.serialized, tagParams),
            this.repositories.comment.findSimilarTags(resolved.serialized, tagParams)
        ]);

        const merged = this.mergeTagScores(merchantResults, commentResults);
        const topTags = merged.slice(0, EMBEDDING_TAG_SUGGESTION_LIMIT);

        return topTags.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);
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
        const resolved = await this.resolveSerializedEmbedding(llm, suggestionContext);

        if (!isDefined(resolved)) {
            return [];
        }

        const commentResults = await this.repositories.merchant.findSimilarComments(resolved.serialized, {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold: resolved.distanceThreshold,
            categoryId,
            commentLimit: EMBEDDING_COMMENT_SUGGESTION_LIMIT
        });

        return commentResults.map(row => row.comment).filter(isNotEmptyString);
    }

    private async resolveSerializedEmbedding(
        llm: LlmInterface,
        suggestionContext: SuggestionContextInterface
    ): Promise<{ readonly serialized: Uint8Array; readonly distanceThreshold: number } | null> {
        const serialized = await this.generateSerializedEmbedding(suggestionContext.context, llm);

        if (!isDefined(serialized)) {
            return null;
        }

        return { serialized, distanceThreshold: suggestionContext.distanceThreshold };
    }

    private resolveSuggestionContext(
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): SuggestionContextInterface {
        const hasVoiceContext = isNotEmptyString(aiContext);
        const context = hasVoiceContext ? aiContext : buildTransactionContext({ title: transactionTitle, mccDescription, comment });
        const distanceThreshold = hasVoiceContext ? EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD : EMBEDDING_VEC_DISTANCE_THRESHOLD;

        return { context, distanceThreshold };
    }

    private mergeCategoryScores(
        merchantResults: CategoryScoreResultInterface[],
        commentResults: CategoryScoreResultInterface[]
    ): CategoryScoreResultInterface[] {
        const scoreMap = new Map<number, number>();

        for (const row of merchantResults) {
            scoreMap.set(row.categoryId, (scoreMap.get(row.categoryId) ?? 0) + row.score);
        }

        for (const row of commentResults) {
            scoreMap.set(row.categoryId, (scoreMap.get(row.categoryId) ?? 0) + row.score);
        }

        return [...scoreMap.entries()]
            .map(([categoryId, score]) => ({ categoryId, score }))
            .sort((first, second) => second.score - first.score);
    }

    private mergeTagScores(
        merchantResults: TagScoreResultInterface[],
        commentResults: TagScoreResultInterface[]
    ): TagScoreResultInterface[] {
        const scoreMap = new Map<number, number>();

        for (const row of merchantResults) {
            scoreMap.set(row.tagId, (scoreMap.get(row.tagId) ?? 0) + row.score);
        }

        for (const row of commentResults) {
            scoreMap.set(row.tagId, (scoreMap.get(row.tagId) ?? 0) + row.score);
        }

        return [...scoreMap.entries()].map(([tagId, score]) => ({ tagId, score })).sort((first, second) => second.score - first.score);
    }

    private async generateSerializedEmbedding(context: string, llm: LlmInterface): Promise<Uint8Array | null> {
        aiSuggestLog('svc:generateSerializedEmbedding:start', { context, contextLen: context.length });
        const service = new EmbeddingService(llm);
        const queryEmbedding = await service.generateEmbedding(context);

        if (!isDefined(queryEmbedding) || queryEmbedding.length === 0) {
            aiSuggestLog('svc:generateSerializedEmbedding:empty', { context });

            return null;
        }

        aiSuggestLog('svc:generateSerializedEmbedding:ok', { context, dimensions: queryEmbedding.length });

        return serializeEmbedding(queryEmbedding);
    }
}

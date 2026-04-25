import { UseSuggestionReturnInterface } from '@budgie/ai';
import { TagEntityInterface, getLogger } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useSearchTagsQuery } from '../../tag/query/use-search-tags.query';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';

const logger = getLogger('useTagSuggestion');

import { useEmbedding } from './use-embedding.hook';
import { useSuggestionBase } from './use-suggestion-base.hook';

interface UseTagSuggestionParams {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
}

export const useTagSuggestion = (params: UseTagSuggestionParams): UseSuggestionReturnInterface<TagEntityInterface> => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled } = params;

    const { status: embeddingStatus } = useEmbedding();
    const embeddingReady = embeddingStatus === AiSubsystemStatusEnum.READY;
    const { tags: allTags, isLoading: isTagsLoading } = useSearchTagsQuery('');
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasTagsLoaded = isNotEmptyArray(allTags);

    const fetchSuggestions = async (): Promise<TagEntityInterface[]> => {
        if (!isNotEmptyArray(allTags)) {
            return [];
        }

        const mccDescription = mccCategory?.fullDescription ?? null;
        logger.log('hook:suggestion:tag:fetch:start', {
            transactionTitle,
            categoryId,
            mccCategoryId,
            mccDescription,
            comment,
            aiContext,
            tagsLength: allTags.length
        });
        const results = await embeddingSuggestionService.suggestTags(
            allTags,
            categoryId,
            transactionTitle,
            mccDescription,
            comment,
            aiContext
        );
        logger.log('hook:suggestion:tag:fetch:done', { count: results.length, ids: results.map(tag => tag.id) });

        return results;
    };

    logger.log('hook:suggestion:tag:hook:state', {
        enabled,
        embeddingStatus,
        embeddingReady,
        isMccLoading,
        isTagsLoading,
        hasTagsLoaded,
        tagsLength: allTags?.length ?? 0
    });

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [embeddingReady, !isMccLoading, !isTagsLoading, hasTagsLoaded],
        requestKeyParts: [transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled, embeddingReady, allTags?.length ?? 0],
        fetchSuggestions
    });

    return { status, suggestions };
};

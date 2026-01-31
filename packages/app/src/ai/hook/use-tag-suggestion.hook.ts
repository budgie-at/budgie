import { TagEntityInterface } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../category/query/use-get-category-by-id.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useSearchTagsQuery } from '../../tag/query/use-search-tags.query';
import { useLlmContext } from '../context/llm.context';
import { TagLlmService } from '../service/tag-llm.service';

interface UseTagSuggestionParams {
    transactionTitle: string;
    categoryId: number;
    mccCategoryId: number | null;
    comment: string;
    aiContext: string;
    enabled: boolean;
}

type InternalStatus = 'idle' | 'loading' | 'success' | 'error';
type TagSuggestionStatus = 'idle' | 'initializing' | 'loading' | 'success' | 'error';

interface UseTagSuggestionReturn {
    status: TagSuggestionStatus;
    suggestedTags: TagEntityInterface[];
}

export const useTagSuggestion = (params: UseTagSuggestionParams): UseTagSuggestionReturn => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled } = params;

    const { llm } = useLlmContext();
    const { tags: allTags, isLoading: isTagsLoading } = useSearchTagsQuery('');
    const { category, isLoading: isCategoryLoading } = useGetCategoryByIdQuery(categoryId);
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const [internalStatus, setInternalStatus] = useState<InternalStatus>('idle');
    const [suggestedTags, setSuggestedTags] = useState<TagEntityInterface[]>([]);

    const hasTriggeredRef = useRef(false);

    const hasTagsLoaded = isNotEmptyArray(allTags);

    useEffect(() => {
        /* eslint-disable lingui/no-unlocalized-strings, no-console */
        console.log('[TagSuggestion] Effect check:', {
            enabled,
            llmReady: llm.isReady,
            isCategoryLoading,
            isMccLoading,
            isTagsLoading,
            hasTagsLoaded,
            hasTriggered: hasTriggeredRef.current,
            tagsCount: allTags?.length ?? 0,
            categoryTitle: category?.title ?? null
        });

        if (!enabled || !llm.isReady || isCategoryLoading || isMccLoading || isTagsLoading || !hasTagsLoaded || hasTriggeredRef.current) {
            console.log('[TagSuggestion] Skipping - conditions not met');

            return;
        }

        hasTriggeredRef.current = true;
        console.log('[TagSuggestion] Triggering suggestion...');

        const suggest = async (): Promise<void> => {
            setInternalStatus('loading');

            try {
                const service = new TagLlmService(llm);
                const suggestionComment = isNotEmptyString(aiContext) ? aiContext : comment;
                const mccDescription = mccCategory?.fullDescription ?? null;
                const categoryName = category?.titleEn ?? category?.title ?? null;

                console.log('[TagSuggestion] Params:', {
                    transactionTitle,
                    categoryName,
                    mccDescription,
                    comment: suggestionComment,
                    tagsCount: allTags.length
                });

                const results = await service.suggestTags({
                    transactionTitle,
                    categoryName,
                    mccDescription,
                    comment: suggestionComment,
                    tags: allTags
                });

                console.log('[TagSuggestion] Results:', results.map(t => `${t.id}=${t.title}`));
                setSuggestedTags(results);
                setInternalStatus(isNotEmptyArray(results) ? 'success' : 'error');
            } catch (error: unknown) {
                console.error('[TagSuggestion] Error:', error);
                setInternalStatus('error');
            }
        };
        /* eslint-enable lingui/no-unlocalized-strings, no-console */

        void suggest();
    }, [enabled, llm.isReady, isCategoryLoading, isMccLoading, isTagsLoading, hasTagsLoaded]);

    const isWaitingForLlm =
        enabled && (!llm.isReady || isCategoryLoading || isMccLoading || isTagsLoading || !hasTagsLoaded) && internalStatus === 'idle';
    const status: TagSuggestionStatus = isWaitingForLlm ? 'initializing' : internalStatus;

    return { status, suggestedTags };
};

import { UseSuggestionReturnInterface } from '@budgie/ai';
import { TagEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useSearchTagsQuery } from '../../tag/query/use-search-tags.query';
import { useLlmContext } from '../context/llm.context';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';

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

    const { llm } = useLlmContext();
    const { tags: allTags, isLoading: isTagsLoading } = useSearchTagsQuery('');
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasTagsLoaded = isNotEmptyArray(allTags);

    const fetchSuggestions = async (): Promise<TagEntityInterface[]> => {
        if (!isNotEmptyArray(allTags)) {
            return [];
        }

        const mccDescription = mccCategory?.fullDescription ?? null;

        return embeddingSuggestionService.suggestTags(llm, allTags, categoryId, transactionTitle, mccDescription, comment, aiContext);
    };

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [llm.isEmbeddingReady, !isMccLoading, !isTagsLoading, hasTagsLoaded],
        requestKeyParts: [
            transactionTitle,
            categoryId,
            mccCategoryId,
            comment,
            aiContext,
            enabled,
            llm.isEmbeddingReady,
            allTags?.length ?? 0
        ],
        fetchSuggestions
    });

    return { status, suggestions };
};

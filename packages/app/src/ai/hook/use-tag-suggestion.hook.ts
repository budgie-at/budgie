import { EmbeddingSuggestionService, UseSuggestionReturnInterface, buildTransactionContext } from '@budgie/ai';
import { TagEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { useGetCategoryByIdQuery } from '../../category/query/use-get-category-by-id.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useSearchTagsQuery } from '../../tag/query/use-search-tags.query';
import { useLlmContext } from '../context/llm.context';

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
    const { category, isLoading: isCategoryLoading } = useGetCategoryByIdQuery(categoryId);
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasTagsLoaded = isNotEmptyArray(allTags);
    const isReady = enabled && llm.isReady && !isCategoryLoading && !isMccLoading && !isTagsLoading && hasTagsLoaded;

    const fetchSuggestions = async (): Promise<TagEntityInterface[]> => {
        const start = performance.now();
        console.log('[TagSuggest] fetchSuggestions START'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
        if (!isNotEmptyArray(allTags)) {
            return [];
        }

        const mccDescription = mccCategory?.fullDescription ?? null;
        const categoryName = category?.titleEn ?? category?.title ?? null;
        const context = isNotEmptyString(aiContext)
            ? aiContext
            : buildTransactionContext(transactionTitle, mccDescription, comment, { categoryName });

        const embeddingSuggestionService = new EmbeddingSuggestionService(titleEmbeddingRepository);

        const result = await embeddingSuggestionService.suggestTags(context, llm, allTags);
        console.log(`[TagSuggest] fetchSuggestions done in ${(performance.now() - start).toFixed(0)}ms, results=${result.length}`); // eslint-disable-line no-console, lingui/no-unlocalized-strings

        return result;
    };

    return useSuggestionBase({
        enabled,
        isReady,
        fetchSuggestions
    });
};

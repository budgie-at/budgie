import { CategoryLlmService, EmbeddingSuggestionService, UseSuggestionReturnInterface, buildTransactionContext } from '@budgie/ai';
import { CategoryEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useLlmContext } from '../context/llm.context';

import { useSuggestionBase } from './use-suggestion-base.hook';

interface UseCategorySuggestionParams {
    transactionTitle: string;
    mccCategoryId: number | null;
    comment: string;
    aiContext: string;
    enabled: boolean;
}

export const useCategorySuggestion = (params: UseCategorySuggestionParams): UseSuggestionReturnInterface<CategoryEntityInterface> => {
    const { transactionTitle, mccCategoryId, comment, aiContext, enabled } = params;

    const { llm } = useLlmContext();
    const { categories, isLoading: isCategoriesLoading } = useAllCategoriesQuery();
    const { mccCategory, isLoading: isMccLoading } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasCategoriesLoaded = categories.length > 0;
    const isReady = enabled && llm.isReady && !isMccLoading && !isCategoriesLoading && hasCategoriesLoaded;

    const fetchSuggestions = async (): Promise<CategoryEntityInterface[]> => {
        const suggestionComment = isNotEmptyString(aiContext) ? aiContext : comment;
        const mccDescription = mccCategory?.fullDescription ?? null;
        const context = buildTransactionContext(transactionTitle, mccDescription, suggestionComment);

        const embeddingSuggestionService = new EmbeddingSuggestionService(titleEmbeddingRepository);
        const embeddingResults = await embeddingSuggestionService.suggestCategories(context, llm, categories);

        if (isNotEmptyArray(embeddingResults)) {
            return embeddingResults;
        }

        const service = new CategoryLlmService(llm);

        return service.suggestCategories({
            transactionTitle,
            mccDescription,
            comment: suggestionComment,
            categories
        });
    };

    return useSuggestionBase({
        enabled,
        isReady,
        fetchSuggestions
    });
};

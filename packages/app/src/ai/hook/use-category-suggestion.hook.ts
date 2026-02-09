import { EmbeddingSuggestionService, UseSuggestionReturnInterface, buildTransactionContext } from '@budgie/ai';
import { CategoryEntityInterface } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useLlmContext } from '../context/llm.context';

import { useSuggestionBase } from './use-suggestion-base.hook';

interface UseCategorySuggestionParams {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
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

        return embeddingSuggestionService.suggestCategories(context, llm, categories);
    };

    return useSuggestionBase({
        enabled,
        isReady,
        fetchSuggestions
    });
};

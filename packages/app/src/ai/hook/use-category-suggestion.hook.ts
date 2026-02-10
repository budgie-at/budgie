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
        const start = performance.now();
        console.log('[CatSuggest] fetchSuggestions START'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
        const mccDescription = mccCategory?.fullDescription ?? null;
        const context = isNotEmptyString(aiContext) ? aiContext : buildTransactionContext(transactionTitle, mccDescription, comment);

        const embeddingSuggestionService = new EmbeddingSuggestionService(titleEmbeddingRepository);

        const result = await embeddingSuggestionService.suggestCategories(context, llm, categories);
        console.log(`[CatSuggest] fetchSuggestions done in ${(performance.now() - start).toFixed(0)}ms, results=${result.length}`); // eslint-disable-line no-console, lingui/no-unlocalized-strings

        return result;
    };

    return useSuggestionBase({
        enabled,
        isReady,
        fetchSuggestions
    });
};

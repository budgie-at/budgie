import { UseSuggestionReturnInterface } from '@budgie/ai';
import { CategoryEntityInterface } from '@budgie/contracts';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useLlmContext } from '../context/llm.context';
import { embeddingSuggestionService } from '../service/embedding-suggestion.service';

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

    const fetchSuggestions = async (): Promise<CategoryEntityInterface[]> => {
        const mccDescription = mccCategory?.fullDescription ?? null;

        return embeddingSuggestionService.suggestCategories(llm, categories, transactionTitle, mccDescription, comment, aiContext);
    };

    const { status, suggestions } = useSuggestionBase({
        enabled,
        readyChecks: [llm.isReady, !isMccLoading, !isCategoriesLoading, hasCategoriesLoaded],
        requestKeyParts: [transactionTitle, mccCategoryId, comment, aiContext, enabled, llm.isReady, categories.length],
        fetchSuggestions
    });

    return { status, suggestions };
};

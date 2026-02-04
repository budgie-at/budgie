import { CategoryEntityInterface } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetMccCategoryByIdQuery } from '../../mcc-category/query/use-get-mcc-category-by-id.query';
import { useLlmContext } from '../context/llm.context';
import { UseSuggestionReturnInterface } from '../interface/use-suggestion-return.interface';
import { CategoryLlmService } from '../service/category-llm.service';

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
        const service = new CategoryLlmService(llm);
        const suggestionComment = isNotEmptyString(aiContext) ? aiContext : comment;

        return service.suggestCategories({
            transactionTitle,
            mccDescription: mccCategory?.fullDescription ?? null,
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

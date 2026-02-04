import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

interface UseSuggestionVisibilityParams {
    isNewTransaction: boolean;
    isSplitActive: boolean;
    categoryId: number | null;
    tagIds: number[];
    accountId: number;
    mccCategoryId: number | null;
    comment: string;
    aiContext: string;
}

interface UseSuggestionVisibilityReturn {
    showRepeatedSuggestions: boolean;
    showCategorySuggestions: boolean;
    showTagSuggestions: boolean;
}

export const useSuggestionVisibility = (params: UseSuggestionVisibilityParams): UseSuggestionVisibilityReturn => {
    const { isNewTransaction, isSplitActive, categoryId, tagIds, accountId, mccCategoryId, comment, aiContext } = params;

    const hasContext = isPositiveNumber(mccCategoryId) || isNotEmptyString(comment) || isNotEmptyString(aiContext);
    const hasCategorySelected = isPositiveNumber(categoryId);
    const hasTagsSelected = isNotEmptyArray(tagIds);

    const showRepeatedSuggestions = isNewTransaction && !hasCategorySelected && !isSplitActive && isPositiveNumber(accountId);
    const showCategorySuggestions = !isNewTransaction && !hasCategorySelected && hasContext && !isSplitActive;
    const showTagSuggestions = !isNewTransaction && hasCategorySelected && !hasTagsSelected && hasContext && !isSplitActive;

    return {
        showRepeatedSuggestions,
        showCategorySuggestions,
        showTagSuggestions
    };
};

import { CategoryEntityInterface } from '@budgie/contracts';

import { useCategorySuggestion } from '../../ai/hook/use-category-suggestion.hook';

interface UseCategorySuggestionRowParams {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (categoryId: number) => void;
}

export const useCategorySuggestionRow = (params: UseCategorySuggestionRowParams) => {
    const { onSelect, ...suggestionParams } = params;

    const { suggestions, status } = useCategorySuggestion(suggestionParams);

    const handleSelect = (category: CategoryEntityInterface): void => {
        onSelect(category.id);
    };

    return { suggestions, status, handleSelect };
};

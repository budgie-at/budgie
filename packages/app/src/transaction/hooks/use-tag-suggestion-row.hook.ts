import { TagEntityInterface } from '@budgie/contracts';

import { useTagSuggestion } from '../../ai/hook/use-tag-suggestion.hook';

interface UseTagSuggestionRowParams {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (tagId: number) => void;
}

export const useTagSuggestionRow = (params: UseTagSuggestionRowParams) => {
    const { onSelect, ...suggestionParams } = params;

    const { suggestions, status } = useTagSuggestion(suggestionParams);

    const handleSelect = (tag: TagEntityInterface): void => {
        onSelect(tag.id);
    };

    return { suggestions, status, handleSelect };
};

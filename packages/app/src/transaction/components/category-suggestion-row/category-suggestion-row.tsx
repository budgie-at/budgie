import { CategoryEntityInterface } from '@budgie/contracts';

import { useCategorySuggestion } from '../../../ai/hook/use-category-suggestion.hook';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (categoryId: number) => void;
}

const getCategoryKey = (category: CategoryEntityInterface): number => category.id;
const getCategoryIcon = (category: CategoryEntityInterface) => category.icon;
const getCategoryTitle = (category: CategoryEntityInterface): string => category.title;

export const CategorySuggestionRow = (props: Props) => {
    const { transactionTitle, mccCategoryId, comment, aiContext, enabled, onSelect } = props;

    const { suggestions, status } = useCategorySuggestion({
        transactionTitle,
        mccCategoryId,
        comment,
        aiContext,
        enabled
    });

    const handleSelect = (category: CategoryEntityInterface): void => {
        onSelect(category.id);
    };

    return (
        <IconTitleSuggestionRow
            suggestions={suggestions}
            status={status}
            enabled={enabled}
            onSelect={handleSelect}
            getKey={getCategoryKey}
            getIcon={getCategoryIcon}
            getTitle={getCategoryTitle}
        />
    );
};

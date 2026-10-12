import { useCategorySuggestion } from '../../../ai/hook/use-category-suggestion.hook';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';
import { IconTitleSuggestionRowSelector } from '../icon-title-suggestion-row/icon-title-suggestion-row.selector';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (categoryId: number) => void;
}

export const CategorySuggestionRow = (props: Props) => {
    const { transactionTitle, mccCategoryId, comment, aiContext, enabled, onSelect } = props;

    const { suggestions, status } = useCategorySuggestion({
        transactionTitle,
        mccCategoryId,
        comment,
        aiContext,
        enabled
    });

    return (
        <IconTitleSuggestionRow
            items={suggestions.map(category => ({
                key: category.id,
                icon: category.icon,
                title: category.title,
                onSelect: () => void onSelect(category.id)
            }))}
            status={status}
            enabled={enabled}
            testIDPrefix={IconTitleSuggestionRowSelector.Category}
        />
    );
};

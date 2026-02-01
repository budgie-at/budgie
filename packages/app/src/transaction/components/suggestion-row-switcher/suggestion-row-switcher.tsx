import { CategorySuggestionsRow } from '../category-suggestions-row/category-suggestions-row';
import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';
import { TagSuggestionsRow } from '../tag-suggestions-row/tag-suggestions-row';

interface Props {
    readonly isSplitActive: boolean;
    readonly showTagSuggestions: boolean;
    readonly showCategorySuggestions: boolean;
    readonly transactionTitle: string;
    readonly categoryId: number | null;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly onSelectTag: (tagId: number) => void;
    readonly onSelectCategory: (categoryId: number) => void;
}

export const SuggestionRowSwitcher = (props: Props) => {
    const {
        isSplitActive,
        showTagSuggestions,
        showCategorySuggestions,
        transactionTitle,
        categoryId,
        mccCategoryId,
        comment,
        aiContext,
        onSelectTag,
        onSelectCategory
    } = props;

    if (isSplitActive) {
        return <SuggestionRowSpacer />;
    }

    if (showTagSuggestions) {
        return (
            <TagSuggestionsRow
                transactionTitle={transactionTitle}
                categoryId={categoryId ?? 0}
                mccCategoryId={mccCategoryId}
                comment={comment}
                aiContext={aiContext}
                enabled={showTagSuggestions}
                onSelect={onSelectTag}
            />
        );
    }

    return (
        <CategorySuggestionsRow
            transactionTitle={transactionTitle}
            mccCategoryId={mccCategoryId}
            comment={comment}
            aiContext={aiContext}
            enabled={showCategorySuggestions}
            onSelect={onSelectCategory}
        />
    );
};

import { isNotEmptyArray } from '@rnw-community/shared';

import { useCategorySuggestion } from '../../../ai/hook/use-category-suggestion.hook';
import { useSuggestionLoadingState } from '../../hook/use-suggestion-loading-state.hook';
import { CategorySuggestionPillItem } from '../category-suggestion-pill-item/category-suggestion-pill-item';
import { SuggestionRowLayout } from '../suggestion-row-layout/suggestion-row-layout';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (categoryId: number) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const CategorySuggestionsRow = (props: Props) => {
    const { transactionTitle, mccCategoryId, comment, aiContext, enabled, onSelect } = props;

    const { status, suggestions: suggestedCategories } = useCategorySuggestion({
        transactionTitle,
        mccCategoryId,
        comment,
        aiContext,
        enabled
    });

    const { showLoading, showContent, markSelected } = useSuggestionLoadingState({
        status,
        hasResults: isNotEmptyArray(suggestedCategories),
        enabled
    });

    const handleSelect = (categoryId: number): void => {
        markSelected();
        onSelect(categoryId);
    };

    return (
        <SuggestionRowLayout showContent={showContent} showLoading={showLoading}>
            {suggestedCategories.map((category, index) => (
                <CategorySuggestionPillItem
                    key={category.id}
                    category={category}
                    index={index}
                    animationDuration={ANIMATION_DURATION}
                    staggerDelay={STAGGER_DELAY}
                    onSelect={handleSelect}
                />
            ))}
        </SuggestionRowLayout>
    );
};

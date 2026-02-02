import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useCategorySuggestion } from '../../../ai/hook/use-category-suggestion.hook';
import { useSuggestionLoadingState } from '../../hook/use-suggestion-loading-state.hook';
import { CategorySuggestionPillItem } from '../category-suggestion-pill-item/category-suggestion-pill-item';
import { SuggestionLoadingIndicator } from '../suggestion-loading-indicator/suggestion-loading-indicator';

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

    /* jscpd:ignore-start - Shared suggestion row layout, differs by pill item type */
    const pillsContent = showLoading ? (
        <View className="flex-1" />
    ) : (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerClassName="flex-grow justify-end gap-sm"
        >
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
        </ScrollView>
    );

    return (
        <View className="h-10 items-end justify-center overflow-hidden">
            {showContent ? (
                <Animated.View
                    entering={FadeIn.duration(ANIMATION_DURATION)}
                    exiting={FadeOut.duration(ANIMATION_DURATION)}
                    className="flex-row items-center overflow-hidden"
                >
                    {pillsContent}
                    <SuggestionLoadingIndicator isAnimating={showLoading} />
                </Animated.View>
            ) : null}
        </View>
    );
    /* jscpd:ignore-end */
};

import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useTagSuggestion } from '../../../ai/hook/use-tag-suggestion.hook';
import { useSuggestionLoadingState } from '../../hook/use-suggestion-loading-state.hook';
import { SuggestionLoadingIndicator } from '../suggestion-loading-indicator/suggestion-loading-indicator';
import { TagSuggestionPillItem } from '../tag-suggestion-pill-item/tag-suggestion-pill-item';

interface Props {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (tagId: number) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const TagSuggestionsRow = (props: Props) => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled, onSelect } = props;

    const { status, suggestions: suggestedTags } = useTagSuggestion({
        transactionTitle,
        categoryId,
        mccCategoryId,
        comment,
        aiContext,
        enabled
    });

    const { showLoading, showContent, markSelected } = useSuggestionLoadingState({
        status,
        hasResults: isNotEmptyArray(suggestedTags),
        enabled
    });

    const handleSelect = (tagId: number): void => {
        markSelected();
        onSelect(tagId);
    };

    const pillsContent = showLoading ? (
        <View className="flex-1" />
    ) : (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerClassName="flex-grow justify-end gap-sm"
        >
            {suggestedTags.map((tag, index) => (
                <TagSuggestionPillItem
                    key={tag.id}
                    tag={tag}
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
};

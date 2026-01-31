import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useCategorySuggestion } from '../../../ai/hook/use-category-suggestion.hook';
import { CategorySuggestionLoadingIndicator } from '../category-suggestion-loading-indicator/category-suggestion-loading-indicator';
import { CategorySuggestionPillItem } from '../category-suggestion-pill-item/category-suggestion-pill-item';

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
const LOADING_DELAY_MS = 400;

// eslint-disable-next-line max-statements -- Component with multiple state hooks and effect for delayed loading logic
export const CategorySuggestionsRow = (props: Props) => {
    const { transactionTitle, mccCategoryId, comment, aiContext, enabled, onSelect } = props;

    const [showLoading, setShowLoading] = useState(false);
    const [hasSelected, setHasSelected] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasProcessingRef = useRef(false);

    const handleSelect = (categoryId: number): void => {
        setHasSelected(true);
        onSelect(categoryId);
    };

    const { status, suggestions: suggestedCategories } = useCategorySuggestion({
        transactionTitle,
        mccCategoryId,
        comment,
        aiContext,
        enabled
    });

    const isInitializing = status === 'initializing';
    const isLoading = status === 'loading';
    const isReady = status === 'success' && isNotEmptyArray(suggestedCategories);
    const isProcessing = isInitializing || isLoading;

    useEffect(() => {
        if (isDefined(timerRef.current)) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (isProcessing && !wasProcessingRef.current) {
            wasProcessingRef.current = true;
            timerRef.current = setTimeout(() => {
                setShowLoading(true);
                timerRef.current = null;
            }, LOADING_DELAY_MS);
        }

        if (!isProcessing && wasProcessingRef.current) {
            wasProcessingRef.current = false;
            timerRef.current = setTimeout(() => {
                setShowLoading(false);
                timerRef.current = null;
            }, 0);
        }

        return () => {
            if (isDefined(timerRef.current)) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isProcessing]);

    const showLoadingIndicator = showLoading && !isReady;
    const showContent = enabled && !hasSelected && (showLoadingIndicator || isReady);

    const pillsContent = showLoadingIndicator ? (
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
                    <CategorySuggestionLoadingIndicator isAnimating={showLoadingIndicator} />
                </Animated.View>
            ) : null}
        </View>
    );
};

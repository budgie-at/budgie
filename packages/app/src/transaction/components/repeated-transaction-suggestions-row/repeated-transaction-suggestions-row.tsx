import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useRepeatedTransactionSuggestion } from '../../hook/use-repeated-transaction-suggestion.hook';
import { useSuggestionLoadingState } from '../../hook/use-suggestion-loading-state.hook';
import { RepeatedTransactionSuggestionPillItem } from '../repeated-transaction-suggestion-pill-item/repeated-transaction-suggestion-pill-item';
import { SuggestionLoadingIndicator } from '../suggestion-loading-indicator/suggestion-loading-indicator';

interface Props {
    readonly enabled: boolean;
    readonly type: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly categoryId: number;
    readonly onSelect: (pattern: RepeatedTransactionPatternInterface) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const RepeatedTransactionSuggestionsRow = (props: Props) => {
    const { enabled, type, accountId, amount, categoryId, onSelect } = props;

    const { status, suggestions } = useRepeatedTransactionSuggestion({
        enabled,
        type,
        accountId,
        amount,
        categoryId
    });

    const { showLoading, showContent, markSelected } = useSuggestionLoadingState({
        status,
        hasResults: isNotEmptyArray(suggestions),
        enabled
    });

    const handleSelect = (pattern: RepeatedTransactionPatternInterface): void => {
        markSelected();
        onSelect(pattern);
    };

    /* jscpd:ignore-start -- Shared suggestion row layout pattern, differs by pill item type */
    const pillsContent = showLoading ? (
        <View className="flex-1" />
    ) : (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerClassName="flex-grow justify-end gap-sm"
        >
            {suggestions.map((pattern, index) => (
                <RepeatedTransactionSuggestionPillItem
                    key={`${pattern.categoryId}-${pattern.title}`}
                    pattern={pattern}
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

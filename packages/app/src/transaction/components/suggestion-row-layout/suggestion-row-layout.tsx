import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAiEmbeddingProgress } from '../../../ai/hook/use-ai-embedding-progress.hook';
import { SuggestionLoadingIndicator } from '../suggestion-loading-indicator/suggestion-loading-indicator';

interface Props {
    readonly showContent: boolean;
    readonly showLoading: boolean;
    readonly isProcessing?: boolean;
    readonly children: ReactNode;
}

const ANIMATION_DURATION = 200;

export const SuggestionRowLayout = (props: Props) => {
    const { showContent, showLoading, isProcessing = false, children } = props;
    const { isIncomplete } = useAiEmbeddingProgress();

    const showStandaloneBrain = !showContent && (isIncomplete || isProcessing);

    const pillsContent = showLoading ? (
        <View className="flex-1" />
    ) : (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerClassName="flex-grow justify-end gap-sm"
        >
            {children}
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
                    <SuggestionLoadingIndicator isLoading={showLoading} />
                </Animated.View>
            ) : null}
            {showStandaloneBrain ? <SuggestionLoadingIndicator isLoading={false} showArrow={false} /> : null}
        </View>
    );
};

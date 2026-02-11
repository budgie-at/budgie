import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAiEmbeddingProgress } from '../../../ai/hook/use-ai-embedding-progress.hook';
import { SuggestionLoadingIndicator } from '../suggestion-loading-indicator/suggestion-loading-indicator';

interface Props {
    readonly showContent: boolean;
    readonly showLoading: boolean;
    readonly children: ReactNode;
}

const ANIMATION_DURATION = 200;

export const SuggestionRowLayout = ({ showContent, showLoading, children }: Props) => {
    const { isIncomplete } = useAiEmbeddingProgress();

    return (
        <View className="h-10 items-end justify-center overflow-hidden">
            {showContent ? (
                <Animated.View
                    entering={FadeIn.duration(ANIMATION_DURATION)}
                    exiting={FadeOut.duration(ANIMATION_DURATION)}
                    className="flex-row items-center overflow-hidden"
                >
                    {showLoading ? (
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
                    )}
                    <SuggestionLoadingIndicator isLoading={showLoading} />
                </Animated.View>
            ) : isIncomplete ? (
                <SuggestionLoadingIndicator showArrow={false} />
            ) : null}
        </View>
    );
};

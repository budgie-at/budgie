import { ReactNode, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAi } from '../../../ai/hook/use-ai.hook';
import { SuggestionLoadingIndicator } from '../suggestion-loading-indicator/suggestion-loading-indicator';

interface Props {
    readonly showContent: boolean;
    readonly showLoading: boolean;
    readonly isProcessing?: boolean;
    readonly children: ReactNode;
}

const ANIMATION_DURATION = 200;
const ENTER_DELAY = 400;
const EMBEDDING_COMPLETENESS_THRESHOLD = 90;

export const SuggestionRowLayout = (props: Props) => {
    const { showContent, showLoading, isProcessing = false, children } = props;
    const { progress } = useAi();
    const isIncomplete = progress < EMBEDDING_COMPLETENESS_THRESHOLD;
    const scrollRef = useRef<ScrollView | null>(null);

    const showBrain = showContent || isIncomplete || isProcessing;
    const brainIsLoading = showLoading || isProcessing;
    const showPills = showContent && !showLoading;

    const handleContentSizeChange = () => {
        scrollRef.current?.scrollToEnd({ animated: false });
    };

    return (
        <View className="h-10 flex-row items-center justify-end overflow-hidden">
            {showPills ? (
                <Animated.View
                    entering={FadeIn.duration(ANIMATION_DURATION).delay(ENTER_DELAY)}
                    exiting={FadeOut.duration(ANIMATION_DURATION)}
                    className="flex-row items-center overflow-hidden flex-1"
                >
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-1"
                        contentContainerClassName="flex-grow justify-end gap-sm"
                        onContentSizeChange={handleContentSizeChange}
                    >
                        {children}
                    </ScrollView>
                </Animated.View>
            ) : null}
            {showBrain ? (
                <Animated.View entering={FadeIn.duration(ANIMATION_DURATION).delay(ENTER_DELAY)}>
                    <SuggestionLoadingIndicator isLoading={brainIsLoading} showArrow={showPills} />
                </Animated.View>
            ) : null}
        </View>
    );
};

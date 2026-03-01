import { ReactNode, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

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
    const scrollRef = useRef<ScrollView | null>(null);

    const showBrain = showContent || isIncomplete || isProcessing;
    const brainIsLoading = showLoading || isProcessing;
    const showPills = showContent && !showLoading;

    const handleContentSizeChange = () => {
        scrollRef.current?.scrollToEnd({ animated: false });
    };

    const pillsStyle = useAnimatedStyle(() => ({
        opacity: withTiming(showPills ? 1 : 0, { duration: ANIMATION_DURATION })
    }));

    const brainStyle = useAnimatedStyle(() => ({
        opacity: withTiming(showBrain ? 1 : 0, { duration: ANIMATION_DURATION })
    }));

    const pillsPointerEvents = showPills ? 'auto' : 'none';
    const brainPointerEvents = showBrain ? 'auto' : 'none';

    return (
        <View className="h-10 flex-row items-center justify-end overflow-hidden">
            <Animated.View style={pillsStyle} pointerEvents={pillsPointerEvents} className="flex-row items-center overflow-hidden flex-1">
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
            <Animated.View style={brainStyle} pointerEvents={brainPointerEvents}>
                <SuggestionLoadingIndicator isLoading={brainIsLoading} showArrow={showPills} />
            </Animated.View>
        </View>
    );
};

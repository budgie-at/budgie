import { ReactNode, useRef } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { SUGGESTION_MAX_FONT_SCALE } from '../../constant/suggestion-max-font-scale.constant';
import { SUGGESTION_ROW_HEIGHT } from '../../constant/suggestion-row-height.constant';
import { SuggestionLoadingIndicator } from '../suggestion-loading-indicator/suggestion-loading-indicator';

interface Props {
    readonly showContent: boolean;
    readonly showLoading: boolean;
    readonly children: ReactNode;
}

const ANIMATION_DURATION = 200;
const ENTER_DELAY = 400;

export const SuggestionRowLayout = (props: Props) => {
    const { showContent, showLoading, children } = props;
    const scrollRef = useRef<ScrollView | null>(null);
    const rowStyle = { height: SUGGESTION_ROW_HEIGHT * Math.min(useWindowDimensions().fontScale, SUGGESTION_MAX_FONT_SCALE) };

    const showPills = showContent && !showLoading;

    const handleContentSizeChange = () => {
        scrollRef.current?.scrollToEnd({ animated: false });
    };

    return (
        <View className="flex-row items-center justify-end overflow-hidden" style={rowStyle}>
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
            {showLoading ? (
                <Animated.View
                    entering={FadeIn.duration(ANIMATION_DURATION).delay(ENTER_DELAY)}
                    exiting={FadeOut.duration(ANIMATION_DURATION)}
                >
                    <SuggestionLoadingIndicator />
                </Animated.View>
            ) : null}
        </View>
    );
};

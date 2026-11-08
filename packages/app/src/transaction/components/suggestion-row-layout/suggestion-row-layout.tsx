import { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EASE_OUT, MOTION_BASE_DURATION, MOTION_FADE_IN, MOTION_FADE_OUT, MOTION_LAYOUT } from '../../../@generic/constant/motion.constant';
import { SUGGESTION_ROW_HEIGHT } from '../../constant/suggestion-row-height.constant';
import { SuggestionLoadingIndicator } from '../suggestion-loading-indicator/suggestion-loading-indicator';

interface Props {
    readonly showContent: boolean;
    readonly showLoading: boolean;
    readonly children: ReactNode;
}

const LOADING_ENTER_DELAY = 150;
const LOADING_ENTERING = FadeIn.duration(MOTION_BASE_DURATION).easing(EASE_OUT).delay(LOADING_ENTER_DELAY);

export const SuggestionRowLayout = (props: Props) => {
    const { showContent, showLoading, children } = props;
    const rowStyle = { height: SUGGESTION_ROW_HEIGHT };
    const showPills = showContent && !showLoading;

    if (!showPills && !showLoading) {
        return null;
    }

    return (
        <Animated.View
            layout={MOTION_LAYOUT}
            className="min-w-0 flex-1 flex-row items-center justify-start overflow-hidden"
            style={rowStyle}
        >
            {showPills ? (
                <Animated.View entering={MOTION_FADE_IN} exiting={MOTION_FADE_OUT} className="flex-row items-center overflow-hidden flex-1">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerClassName="gap-sm">
                        {children}
                    </ScrollView>
                </Animated.View>
            ) : null}
            {showLoading ? (
                <Animated.View entering={LOADING_ENTERING} exiting={MOTION_FADE_OUT}>
                    <SuggestionLoadingIndicator />
                </Animated.View>
            ) : null}
        </Animated.View>
    );
};

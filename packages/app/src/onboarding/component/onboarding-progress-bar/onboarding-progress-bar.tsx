/* oxlint-disable lingui/no-unlocalized-strings -- NativeWind class names, not user-facing copy */
import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';

const SEGMENT_HEIGHT = 3;
const FULL_OPACITY = 1;
const ZERO_OPACITY = 0;
const FILL_SPRING_CONFIG = { damping: 18, stiffness: 140 };
const FILLED_SEGMENT_CLASS_NAME = 'flex-1 rounded-full border border-primary bg-primary';
const MUTED_SEGMENT_CLASS_NAME = 'flex-1 rounded-full border border-secondary-corner';
const CONTAINER_STYLE: ViewStyle = { height: SEGMENT_HEIGHT };

interface Props {
    readonly step: OnboardingStepEnum;
}

export const OnboardingProgressBar = ({ step }: Props) => {
    const reducedMotion = useReducedMotion();
    const currentIndex = ONBOARDING_STEP_ORDER.indexOf(step);
    const currentSegmentFill = useSharedValue(reducedMotion ? FULL_OPACITY : ZERO_OPACITY);

    useEffect(() => {
        if (reducedMotion) {
            currentSegmentFill.value = FULL_OPACITY;

            return;
        }

        currentSegmentFill.value = ZERO_OPACITY;
        currentSegmentFill.value = withSpring(FULL_OPACITY, FILL_SPRING_CONFIG);
    }, [currentIndex, reducedMotion, currentSegmentFill]);

    const currentSegmentStyle = useAnimatedStyle(() => ({ opacity: currentSegmentFill.value }));

    return (
        <View className="flex-row gap-x-xs" style={CONTAINER_STYLE}>
            {ONBOARDING_STEP_ORDER.map((orderedStep, index) => {
                const isFilled = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const segmentClassName = isFilled ? FILLED_SEGMENT_CLASS_NAME : MUTED_SEGMENT_CLASS_NAME;

                return <Animated.View key={orderedStep} className={segmentClassName} {...(isCurrent && { style: currentSegmentStyle })} />;
            })}
        </View>
    );
};

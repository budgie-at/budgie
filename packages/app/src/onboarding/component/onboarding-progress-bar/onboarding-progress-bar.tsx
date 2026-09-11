/* oxlint-disable lingui/no-unlocalized-strings -- NativeWind class names, not user-facing copy */
import { View, ViewStyle } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';

const SEGMENT_HEIGHT = 3;
const FILL_SPRING_DAMPING = 18;
const FILL_SPRING_STIFFNESS = 140;
const REDUCED_MOTION_FADE_DURATION = 120;
const FILLED_SEGMENT_CLASS_NAME = 'flex-1 rounded-full border border-primary bg-primary';
const MUTED_SEGMENT_CLASS_NAME = 'flex-1 rounded-full border border-secondary-corner';
const CONTAINER_STYLE: ViewStyle = { height: SEGMENT_HEIGHT };

interface Props {
    readonly step: OnboardingStepEnum;
}

export const OnboardingProgressBar = ({ step }: Props) => {
    const reducedMotion = useReducedMotion();
    const currentIndex = ONBOARDING_STEP_ORDER.indexOf(step);
    const currentSegmentEntering = reducedMotion
        ? FadeIn.duration(REDUCED_MOTION_FADE_DURATION)
        : FadeIn.springify().damping(FILL_SPRING_DAMPING).stiffness(FILL_SPRING_STIFFNESS);

    return (
        <View className="flex-row gap-x-xs" style={CONTAINER_STYLE}>
            {ONBOARDING_STEP_ORDER.map((orderedStep, index) => {
                const isFilled = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const segmentClassName = isFilled ? FILLED_SEGMENT_CLASS_NAME : MUTED_SEGMENT_CLASS_NAME;
                const segmentKey = isCurrent ? `${orderedStep}-${currentIndex}` : orderedStep;

                return (
                    <Animated.View key={segmentKey} className={segmentClassName} {...(isCurrent && { entering: currentSegmentEntering })} />
                );
            })}
        </View>
    );
};

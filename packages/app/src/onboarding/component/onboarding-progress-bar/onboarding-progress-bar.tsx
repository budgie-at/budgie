/* oxlint-disable lingui/no-unlocalized-strings */
import { cva } from 'class-variance-authority';
import { ClassValue } from 'cn';
import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { ONBOARDING_STEP_ACCENT } from '../../constant/onboarding-step-accent.constant';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';

const SEGMENT_HEIGHT = 3;
const FULL_OPACITY = 1;
const ZERO_OPACITY = 0;
const FILL_SPRING_CONFIG = { damping: 18, stiffness: 140 };
const MUTED_SEGMENT_CLASS_NAME = 'flex-1 rounded-full border border-secondary-corner';
const CONTAINER_STYLE: ViewStyle = { height: SEGMENT_HEIGHT };

interface Props {
    readonly step: OnboardingStepEnum;
}

const filledSegmentVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('flex-1 rounded-full border', {
    variants: { variant: BACKGROUND_COLOR_PALETTE }
});

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
                const accent = ONBOARDING_STEP_ACCENT[orderedStep];
                const segmentClassName = isFilled ? filledSegmentVariants({ variant: accent }) : MUTED_SEGMENT_CLASS_NAME;

                return <Animated.View key={orderedStep} className={segmentClassName} {...(isCurrent && { style: currentSegmentStyle })} />;
            })}
        </View>
    );
};

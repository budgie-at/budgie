import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useRouter } from 'expo-router';
import { ReactNode, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ONBOARDING_STEP_ACCENT } from '../../constant/onboarding-step-accent.constant';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { OnboardingProgressBar } from '../onboarding-progress-bar/onboarding-progress-bar';

import { OnboardingStepLayoutSelector } from './onboarding-step-layout.selector';

const CONTENT_TRANSLATE_X = 16;
const CONTENT_ANIMATION_DURATION = 260;
const REDUCED_MOTION_ANIMATION_DURATION = 120;
const FULL_OPACITY = 1;
const ZERO_OPACITY = 0;
const ZERO_TRANSLATE_X = 0;
const CIRCLE_ICON_SIZE = 64;
const CIRCLE_ICON_INNER_SIZE = 32;

interface Props {
    readonly step: OnboardingStepEnum;
    readonly title: string;
    readonly description: string;
    readonly icon?: UserIconNameEnum;
    readonly children: ReactNode;
    readonly primaryLabel: string;
    readonly onPrimary: EmptyFn;
    readonly isPrimaryDisabled?: boolean;
}

export const OnboardingStepLayout = (props: Props) => {
    const { step, title, description, icon, children, primaryLabel, onPrimary, isPrimaryDisabled } = props;

    const router = useRouter();
    const reducedMotion = useReducedMotion();
    const [, hapticImpact] = useVibration();

    const contentTranslateX = useSharedValue(reducedMotion ? ZERO_TRANSLATE_X : CONTENT_TRANSLATE_X);
    const contentOpacity = useSharedValue(ZERO_OPACITY);

    useEffect(() => {
        const duration = reducedMotion ? REDUCED_MOTION_ANIMATION_DURATION : CONTENT_ANIMATION_DURATION;

        contentTranslateX.value = reducedMotion ? ZERO_TRANSLATE_X : CONTENT_TRANSLATE_X;
        contentOpacity.value = ZERO_OPACITY;
        contentTranslateX.value = withTiming(ZERO_TRANSLATE_X, { duration });
        contentOpacity.value = withTiming(FULL_OPACITY, { duration });
    }, [step, reducedMotion, contentTranslateX, contentOpacity]);

    const handleSkip = () => {
        const currentIndex = ONBOARDING_STEP_ORDER.indexOf(step);
        const nextStep = ONBOARDING_STEP_ORDER[currentIndex + 1];

        void router.push(`./${nextStep.toLowerCase()}`);
    };

    const handlePrimaryPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPrimary();
    };

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));

    const accent = ONBOARDING_STEP_ACCENT[step];
    const isProgressBarVisible = step !== OnboardingStepEnum.WELCOME;
    const isSkipVisible = step !== OnboardingStepEnum.DONE;

    return (
        <View testID={OnboardingStepLayoutSelector.Root} className="flex-1 bg-background px-5xl">
            {isProgressBarVisible ? <OnboardingProgressBar step={step} /> : null}

            {isSkipVisible ? (
                <View className="items-end">
                    <HapticPressable testID={OnboardingStepLayoutSelector.SkipButton} onPress={handleSkip} className="py-3xl">
                        <Text className="text-secondary-foreground/50 text-sm font-medium">
                            <Trans>Skip</Trans>
                        </Text>
                    </HapticPressable>
                </View>
            ) : null}

            <Animated.View key={step} style={contentStyle} className="flex-1">
                {isDefined(icon) ? (
                    <CircleIcon
                        icon={icon}
                        variant={accent}
                        size={CIRCLE_ICON_SIZE}
                        iconSize={CIRCLE_ICON_INNER_SIZE}
                        className="rounded-3xl mb-3xl"
                    />
                ) : null}

                <Text className="text-primary text-4xl font-semibold leading-tight tracking-tight text-left">{title}</Text>
                <Text className="text-secondary-foreground text-md leading-relaxed mt-lg mb-5xl text-left">{description}</Text>

                <View className="flex-1">{children}</View>
            </Animated.View>

            <Button
                testID={OnboardingStepLayoutSelector.PrimaryButton}
                variant={accent}
                content={primaryLabel}
                onPress={handlePrimaryPress}
                disabled={isPrimaryDisabled}
                className="mb-5xl"
            />
        </View>
    );
};

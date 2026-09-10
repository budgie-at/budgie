import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { ReactNode, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FullPage } from '../../../@generic/component/page/full-page';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ONBOARDING_STEP_ACCENT } from '../../constant/onboarding-step-accent.constant';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepHeader } from '../onboarding-step-header/onboarding-step-header';

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

    const reducedMotion = useReducedMotion();
    const [, hapticImpact] = useVibration();
    const { goToNextStep, goToPreviousStep } = useOnboardingNavigation();

    const contentTranslateX = useSharedValue(reducedMotion ? ZERO_TRANSLATE_X : CONTENT_TRANSLATE_X);
    const contentOpacity = useSharedValue(ZERO_OPACITY);
    const previousStepIndexRef = useRef(ONBOARDING_STEP_ORDER.indexOf(step));

    useEffect(() => {
        const currentStepIndex = ONBOARDING_STEP_ORDER.indexOf(step);
        const isBackward = currentStepIndex < previousStepIndexRef.current;
        const entranceTranslateX = isBackward ? -CONTENT_TRANSLATE_X : CONTENT_TRANSLATE_X;
        const duration = reducedMotion ? REDUCED_MOTION_ANIMATION_DURATION : CONTENT_ANIMATION_DURATION;

        contentTranslateX.value = reducedMotion ? ZERO_TRANSLATE_X : entranceTranslateX;
        contentOpacity.value = ZERO_OPACITY;
        contentTranslateX.value = withTiming(ZERO_TRANSLATE_X, { duration });
        contentOpacity.value = withTiming(FULL_OPACITY, { duration });

        previousStepIndexRef.current = currentStepIndex;
    }, [step, reducedMotion, contentTranslateX, contentOpacity]);

    const handleSkip = () => void goToNextStep(step);
    const handleBack = () => void goToPreviousStep(step);

    const handlePrimaryPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPrimary();
    };

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateX: contentTranslateX.value }]
    }));

    const accent = ONBOARDING_STEP_ACCENT[step];

    return (
        <FullPage
            testID={OnboardingStepLayoutSelector.Root}
            className="bg-background"
            header={<OnboardingStepHeader step={step} onBack={handleBack} onSkip={handleSkip} />}
            footer={
                <Button
                    testID={OnboardingStepLayoutSelector.PrimaryButton}
                    variant="cta"
                    content={primaryLabel}
                    onPress={handlePrimaryPress}
                    disabled={isPrimaryDisabled}
                    className="mx-5xl mb-5xl"
                />
            }
        >
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
        </FullPage>
    );
};

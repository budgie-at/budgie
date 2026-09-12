import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, useReducedMotion } from 'react-native-reanimated';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FullPage } from '../../../@generic/component/page/full-page';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ONBOARDING_STEP_ACCENT } from '../../constant/onboarding-step-accent.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepHeader } from '../onboarding-step-header/onboarding-step-header';

import { OnboardingStepLayoutSelector } from './onboarding-step-layout.selector';

const CONTENT_ANIMATION_DURATION = 260;
const REDUCED_MOTION_ANIMATION_DURATION = 120;
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

    const contentEntering = reducedMotion
        ? FadeIn.duration(REDUCED_MOTION_ANIMATION_DURATION)
        : FadeInRight.duration(CONTENT_ANIMATION_DURATION);

    const handleSkip = () => void goToNextStep(step);
    const handleBack = () => void goToPreviousStep(step);

    const handlePrimaryPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPrimary();
    };

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
            <Animated.View key={step} entering={contentEntering} className="flex-1">
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

import { useFocusEffect } from 'expo-router';
import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

import { FullPage } from '../../../@generic/component/page/full-page';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepHeader } from '../onboarding-step-header/onboarding-step-header';

import { OnboardingStepLayoutSelector } from './onboarding-step-layout.selector';

const CONTENT_ANIMATION_DURATION = 260;
const REDUCED_MOTION_ANIMATION_DURATION = 120;

interface Props {
    readonly step: OnboardingStepEnum;
    readonly fileState: string;
    readonly isFileSealed?: boolean;
    readonly isBackVisible?: boolean;
    readonly footer: ReactNode;
    readonly children: ReactNode;
}

export const OnboardingStepLayout = (props: Props) => {
    const { step, fileState, isFileSealed = false, isBackVisible = true, footer, children } = props;

    const reducedMotion = useReducedMotion();
    const { goBack } = useOnboardingNavigation();
    const onboardingStep = useSetting('onboardingStep');
    const stepIndex = ONBOARDING_STEP_ORDER.indexOf(step);

    useFocusEffect(() => {
        if (onboardingStep !== stepIndex) {
            appRuntime.runFork(logAndContinue(updateSettingsMutation({ onboardingStep: stepIndex })));
        }
    });

    const contentEntering = reducedMotion
        ? FadeIn.duration(REDUCED_MOTION_ANIMATION_DURATION)
        : FadeInRight.duration(CONTENT_ANIMATION_DURATION);

    return (
        <FullPage
            testID={OnboardingStepLayoutSelector.Root}
            className="bg-background"
            header={
                <OnboardingStepHeader fileState={fileState} isFileSealed={isFileSealed} isBackVisible={isBackVisible} onBack={goBack} />
            }
            footer={<View className="mx-5xl mb-5xl gap-y-md">{footer}</View>}
        >
            <ScrollView className="flex-1" contentContainerClassName="pb-5xl gap-y-5xl" showsVerticalScrollIndicator={false}>
                <Animated.View key={step} entering={contentEntering} className="gap-y-5xl">
                    {children}
                </Animated.View>
            </ScrollView>
        </FullPage>
    );
};

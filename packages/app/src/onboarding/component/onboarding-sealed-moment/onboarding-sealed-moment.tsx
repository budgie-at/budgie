import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useEffect, useEffectEvent } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BottomChromeInsetProvider, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { EmptyFn } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { ENTRANCE_DURATION } from '../../../@generic/constant/entrance-motion.constant';
import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { OnboardingSealedBody } from '../onboarding-sealed-body/onboarding-sealed-body';
import { OnboardingStepFooter } from '../onboarding-step-footer/onboarding-step-footer';

import { OnboardingSealedMomentSelector } from './onboarding-sealed-moment.selector';

interface Props {
    readonly onContinue: EmptyFn;
}

export const OnboardingSealedMoment = ({ onContinue }: Props) => {
    const { t } = useLingui();
    const reducedMotion = useReducedMotion();
    const [, hapticImpact] = useVibration();
    const surfaceEntering = reducedMotion ? FadeIn : FadeIn.duration(ENTRANCE_DURATION).easing(EASE_OUT);

    const signalSealed = useEffectEvent(() => {
        hapticImpact(ImpactFeedbackStyle.Heavy);
        AccessibilityInfo.announceForAccessibility(t`Sealed. Only your PIN opens this file.`);
    });

    useEffect(() => {
        signalSealed();
    }, []);

    return (
        <GroupedSurface>
            <ScreenChromeThemeProvider>
                <BottomChromeInsetProvider>
                    <ScreenChromeFrame>
                        <Animated.View entering={surfaceEntering} className="flex-1">
                            <OnboardingSealedBody onContinue={onContinue} />
                            <OnboardingStepFooter>
                                <PillButton
                                    testID={OnboardingSealedMomentSelector.ContinueButton}
                                    label={t`Continue`}
                                    onPress={onContinue}
                                />
                                <View className="min-h-[44px]" />
                            </OnboardingStepFooter>
                        </Animated.View>
                    </ScreenChromeFrame>
                </BottomChromeInsetProvider>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};

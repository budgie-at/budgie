import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BottomChromeInsetProvider, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { EmptyFn } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { OnboardingSealedActions } from '../onboarding-sealed-actions/onboarding-sealed-actions';
import { OnboardingSealedBody } from '../onboarding-sealed-body/onboarding-sealed-body';

interface Props {
    readonly onContinue: EmptyFn;
}

export const OnboardingSealedMoment = ({ onContinue }: Props) => {
    const { t } = useLingui();
    const reducedMotion = useReducedMotion();
    const [, hapticImpact] = useVibration();
    const surfaceEntering = reducedMotion ? FadeIn : FadeIn.duration(400);

    useEffect(() => {
        hapticImpact(ImpactFeedbackStyle.Heavy);
        AccessibilityInfo.announceForAccessibility(t`Sealed. Only your PIN opens this file.`);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only haptic and announcement
    }, []);

    return (
        <GroupedSurface>
            <ScreenChromeThemeProvider>
                <BottomChromeInsetProvider>
                    <ScreenChromeFrame>
                        <Animated.View entering={surfaceEntering} className="flex-1">
                            <OnboardingSealedBody onContinue={onContinue} />
                            <OnboardingSealedActions onContinue={onContinue} />
                        </Animated.View>
                    </ScreenChromeFrame>
                </BottomChromeInsetProvider>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};

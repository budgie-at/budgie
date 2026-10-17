import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { BudgieLogo } from '../../../@generic/component/budgie-logo/budgie-logo';
import { Button } from '../../../@generic/component/button/button';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';

import { OnboardingWelcomeSelector } from './onboarding-welcome.selector';

const SPLASH_LOGO_SIZE = 200;
const RESTING_LOGO_SIZE = 88;
const RESTING_LOGO_STYLE = { width: RESTING_LOGO_SIZE, height: RESTING_LOGO_SIZE };
const SPLASH_HOLD_DURATION = 450;
const LIFT_DURATION = 750;
const CONTENT_DELAY = 850;
const CONTENT_STAGGER = 120;
const CONTENT_DURATION = 520;
const REDUCED_MOTION_DURATION = 200;
const HALF = 2;
const EASE_OUT_X1 = 0.23;
const EASE_OUT_Y1 = 1;
const EASE_OUT_X2 = 0.32;
const EASE_OUT_Y2 = 1;
const EASE_OUT = Easing.bezier(EASE_OUT_X1, EASE_OUT_Y1, EASE_OUT_X2, EASE_OUT_Y2);
const LIFT_TIMING = { duration: LIFT_DURATION, easing: EASE_OUT };

export const OnboardingWelcome = () => {
    const { t } = useLingui();
    const { height: windowHeight } = useWindowDimensions();

    const restingLogoRef = useRef<View>(null);

    const reducedMotion = useReducedMotion();
    const { goToStep } = useOnboardingNavigation();
    const logoTranslateY = useSharedValue(0);
    const logoScale = useSharedValue(1);

    const handleStartPress = () => void goToStep(OnboardingStepEnum.KEY);

    const handleRestingLogoLayout = () =>
        restingLogoRef.current?.measureInWindow((_x, y, _width, height) => {
            const translateY = y + height / HALF - windowHeight / HALF;
            const scale = RESTING_LOGO_SIZE / SPLASH_LOGO_SIZE;

            if (reducedMotion) {
                logoTranslateY.set(translateY);
                logoScale.set(scale);

                return;
            }

            logoTranslateY.set(withDelay(SPLASH_HOLD_DURATION, withTiming(translateY, LIFT_TIMING)));
            logoScale.set(withDelay(SPLASH_HOLD_DURATION, withTiming(scale, LIFT_TIMING)));
        });

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: logoTranslateY.get() }, { scale: logoScale.get() }]
    }));

    const contentEntering = (index: number) =>
        reducedMotion
            ? FadeIn.duration(REDUCED_MOTION_DURATION)
            : FadeInDown.duration(CONTENT_DURATION)
                  .delay(CONTENT_DELAY + index * CONTENT_STAGGER)
                  .easing(EASE_OUT);

    return (
        <View testID={OnboardingWelcomeSelector.Root} className="flex-1 bg-background">
            <View className="flex-1 px-5xl pt-safe pb-safe">
                <View className="flex-1 items-center justify-center gap-y-3xl">
                    <View ref={restingLogoRef} style={RESTING_LOGO_STYLE} onLayout={handleRestingLogoLayout} />

                    <View className="items-center gap-y-lg">
                        <Animated.Text
                            entering={contentEntering(0)}
                            className="text-primary text-(length:--text-8xl) font-bold tracking-tight"
                        >
                            {t`Budgie`}
                        </Animated.Text>

                        <Animated.View entering={contentEntering(1)} className="items-center">
                            <Text className="text-secondary-foreground text-lg text-center">
                                <Trans>Your money in one file.</Trans>
                            </Text>
                            <Text className="text-primary text-lg font-medium text-center">
                                <Trans>Only you hold the key.</Trans>
                            </Text>
                        </Animated.View>
                    </View>
                </View>

                <Animated.View entering={contentEntering(2)} className="mb-5xl gap-y-lg">
                    <Button
                        testID={OnboardingWelcomeSelector.StartButton}
                        variant="cta"
                        content={t`Get started`}
                        onPress={handleStartPress}
                    />

                    <Text className="text-secondary-foreground text-xs text-center">
                        <Trans>No account needed · Takes about a minute</Trans>
                    </Text>
                </Animated.View>
            </View>

            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                <Animated.View style={logoStyle}>
                    <BudgieLogo size={SPLASH_LOGO_SIZE} />
                </Animated.View>
            </View>
        </View>
    );
};

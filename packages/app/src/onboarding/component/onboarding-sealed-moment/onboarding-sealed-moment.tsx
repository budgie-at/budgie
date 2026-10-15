import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useOnboardingOpensWithLabel } from '../../hook/use-onboarding-opens-with-label.hook';

import { OnboardingSealedMomentSelector } from './onboarding-sealed-moment.selector';

const MOMENT_DURATION = Duration.millis(1600);

interface Props {
    readonly onContinue: EmptyFn;
}

export const OnboardingSealedMoment = ({ onContinue }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();

    const onContinueRef = useRef(onContinue);
    onContinueRef.current = onContinue;

    const reducedMotion = useReducedMotion();
    const [, hapticImpact] = useVibration();
    const opensWith = useOnboardingOpensWithLabel();

    const sealedAt = new Date();
    const sealedDate = intl.formatDate(sealedAt, { day: 'numeric', month: 'long', year: 'numeric' });
    const sealedTime = intl.formatTime(sealedAt, { hour: 'numeric', minute: '2-digit' });
    const surfaceEntering = reducedMotion ? FadeIn : FadeIn.duration(400);
    const lockEntering = reducedMotion ? FadeIn : ZoomIn.springify();

    useEffect(() => {
        hapticImpact(ImpactFeedbackStyle.Heavy);
        AccessibilityInfo.announceForAccessibility(t`Sealed. Only your PIN opens this file.`);

        const fiber = appRuntime.runFork(
            Effect.sleep(MOMENT_DURATION).pipe(Effect.andThen(Effect.sync(() => void onContinueRef.current())))
        );

        return () => void appRuntime.runFork(Fiber.interrupt(fiber));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only effect; ref reads the live callback
    }, []);

    return (
        <Animated.View entering={surfaceEntering} className="flex-1 bg-seal-background pt-safe pb-safe">
            <Pressable
                testID={OnboardingSealedMomentSelector.Root}
                onPress={onContinue}
                accessibilityRole="button"
                accessibilityHint={t`Tap to continue`}
                className="flex-1"
            >
                <View className="flex-1 items-center justify-center gap-y-[26px] px-5xl">
                    <View className="size-[280px] items-center justify-center rounded-full border border-white/12">
                        <View className="size-[210px] items-center justify-center rounded-full border border-white/22">
                            <Animated.View
                                entering={lockEntering}
                                className="size-[140px] items-center justify-center rounded-full bg-white"
                            >
                                <Icon icon={UserIconNameEnum.LockKeyhole} size={64} strokeWidth={1.75} className="text-seal-background" />
                            </Animated.View>
                        </View>
                    </View>

                    <View className="items-center gap-y-lg">
                        <Text className="text-white text-(length:--text-8xl) leading-none font-semibold tracking-[-0.035em]">
                            <Trans>Sealed.</Trans>
                        </Text>

                        <Text className="text-white/80 text-xs font-mono font-medium">
                            {sealedDate} · {sealedTime}
                        </Text>
                    </View>
                </View>

                <View className="mx-5xl rounded-[22px] border border-white/22 bg-white/10 px-4xl py-xs">
                    <View className="flex-row justify-between gap-x-lg border-b border-white/18 py-xl">
                        <Text className="text-white/80 text-sm">
                            <Trans>Opens with</Trans>
                        </Text>
                        <Text className="text-white text-sm">{opensWith}</Text>
                    </View>
                    <View className="flex-row justify-between gap-x-lg py-xl">
                        <Text className="text-white/80 text-sm">
                            <Trans>Copies elsewhere</Trans>
                        </Text>
                        <Text className="text-white text-sm font-semibold">
                            <Trans>None</Trans>
                        </Text>
                    </View>
                </View>

                <Text className="text-white/80 text-md text-center px-5xl pt-6xl pb-[40px]">
                    <Trans>Tap to continue</Trans>
                </Text>
            </Pressable>
        </Animated.View>
    );
};

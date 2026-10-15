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

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useOnboardingOpensWithLabel } from '../../hook/use-onboarding-opens-with-label.hook';
import { OnboardingReceiptCard } from '../onboarding-receipt-card/onboarding-receipt-card';

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
    const receiptRows = [
        { label: t`Opens with`, value: opensWith },
        { label: t`Copies elsewhere`, value: t`None` }
    ];

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
        <Animated.View entering={surfaceEntering} className="flex-1 bg-positive-background pt-safe pb-safe">
            <Pressable
                testID={OnboardingSealedMomentSelector.Root}
                onPress={onContinue}
                accessibilityRole="button"
                accessibilityHint={t`Tap to continue`}
                className="flex-1 px-5xl justify-between"
            >
                <View className="flex-1 items-center justify-center gap-y-3xl">
                    <Animated.View entering={lockEntering}>
                        <CircleIcon icon={UserIconNameEnum.Lock} variant="positive" size={112} iconSize={48} border />
                    </Animated.View>

                    <Text className="text-positive-foreground text-(length:--text-8xl) font-bold tracking-tight">
                        <Trans>Sealed.</Trans>
                    </Text>

                    <Text className="text-positive-foreground text-sm">
                        {sealedDate} · {sealedTime}
                    </Text>
                </View>

                <View className="gap-y-3xl mb-5xl">
                    <OnboardingReceiptCard variant="positive" rows={receiptRows} />

                    <Text className="text-positive-foreground text-sm text-center">
                        <Trans>Tap to continue</Trans>
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    );
};

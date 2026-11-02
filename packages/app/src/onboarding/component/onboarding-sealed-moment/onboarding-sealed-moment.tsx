import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { getCalendars } from 'expo-localization';
import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { Icon } from '../../../@generic/component/icon/icon';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useI18nContext } from '../../../i18n/context/i18n.context';

import { OnboardingSealedMomentSelector } from './onboarding-sealed-moment.selector';

interface Props {
    readonly onContinue: EmptyFn;
}

export const OnboardingSealedMoment = ({ onContinue }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();

    const reducedMotion = useReducedMotion();
    const [, hapticImpact] = useVibration();

    const sealedAt = new Date();
    const sealedDate = intl.formatDate(sealedAt, { day: 'numeric', month: 'long', year: 'numeric' });
    const uses24hourClock = getCalendars().at(0)?.uses24hourClock;
    const sealedTime = intl.formatTime(sealedAt, {
        hour: 'numeric',
        minute: '2-digit',
        ...(isDefined(uses24hourClock) && { hour12: !uses24hourClock })
    });
    const surfaceEntering = reducedMotion ? FadeIn : FadeIn.duration(400);
    const lockEntering = reducedMotion ? FadeIn : ZoomIn.springify();

    useEffect(() => {
        hapticImpact(ImpactFeedbackStyle.Heavy);
        AccessibilityInfo.announceForAccessibility(t`Sealed. Only your PIN opens this file.`);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only haptic and announcement
    }, []);

    return (
        <GroupedSurface>
            <Animated.View entering={surfaceEntering} className="flex-1 pt-safe pb-safe">
                <Pressable
                    testID={OnboardingSealedMomentSelector.Root}
                    onPress={onContinue}
                    accessibilityRole="button"
                    accessibilityHint={t`Tap to continue`}
                    className="flex-1"
                >
                    <View className="flex-1 items-center justify-center gap-y-[26px] px-5xl">
                        <View className="size-[168px] items-center justify-center rounded-full border border-primary/12">
                            <Animated.View
                                entering={lockEntering}
                                className="size-[112px] items-center justify-center rounded-full bg-primary"
                            >
                                <Icon icon={UserIconNameEnum.LockKeyhole} size={52} strokeWidth={1.75} className="text-primary-reverse" />
                            </Animated.View>
                        </View>

                        <View className="items-center gap-y-lg">
                            <Text className="text-primary text-(length:--text-8xl) leading-none font-semibold tracking-[-0.035em]">
                                <Trans>Sealed.</Trans>
                            </Text>

                            <Text className="text-secondary-foreground text-[15px] font-medium">
                                {sealedDate} · {sealedTime}
                            </Text>
                        </View>
                    </View>
                </Pressable>

                <View className="border-t-hairline gap-y-xs border-surface-separator bg-surface px-5xl pt-lg pb-md">
                    <PillButton testID={OnboardingSealedMomentSelector.ContinueButton} label={t`Continue`} onPress={onContinue} />
                    <View className="min-h-[44px]" />
                </View>
            </Animated.View>
        </GroupedSurface>
    );
};

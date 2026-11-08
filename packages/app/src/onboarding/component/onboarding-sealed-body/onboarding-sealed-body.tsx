import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { getCalendars } from 'expo-localization';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';
import { EmptyFn, isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { OnboardingSealedMomentSelector } from '../onboarding-sealed-moment/onboarding-sealed-moment.selector';

const SEAL_ZOOM_DURATION = 500;
const SEAL_ZOOM_DAMPING_RATIO = 0.75;
const SEAL_ZOOM_START_SCALE = 0.85;

interface Props {
    readonly onContinue: EmptyFn;
}

export const OnboardingSealedBody = ({ onContinue }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();

    const reducedMotion = useReducedMotion();
    const { inset } = useBottomChromeInset();

    const [sealedAt] = useState(() => new Date());
    const sealedDate = intl.formatDate(sealedAt, { day: 'numeric', month: 'long', year: 'numeric' });
    const uses24hourClock = getCalendars().at(0)?.uses24hourClock;
    const sealedTime = intl.formatTime(sealedAt, {
        hour: 'numeric',
        minute: '2-digit',
        ...(isDefined(uses24hourClock) && { hour12: !uses24hourClock })
    });
    const lockEntering = reducedMotion
        ? FadeIn
        : ZoomIn.springify()
              .duration(SEAL_ZOOM_DURATION)
              .dampingRatio(SEAL_ZOOM_DAMPING_RATIO)
              .withInitialValues({ transform: [{ scale: SEAL_ZOOM_START_SCALE }] });

    const contentStyle = { paddingBottom: inset };

    return (
        <Pressable
            testID={OnboardingSealedMomentSelector.Root}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityHint={t`Tap to continue`}
            className="flex-1 pt-safe"
            style={contentStyle}
        >
            <View className="flex-1 items-center justify-center gap-y-[26px] px-5xl">
                <View className="size-[168px] items-center justify-center rounded-full border border-primary/12">
                    <Animated.View entering={lockEntering} className="size-[112px] items-center justify-center rounded-full bg-primary">
                        <Icon icon={UserIconNameEnum.LockKeyhole} size={52} strokeWidth={1.75} className="text-primary-reverse" />
                    </Animated.View>
                </View>

                <View className="items-center gap-y-lg">
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                        maxFontSizeMultiplier={1.4}
                        className="text-primary text-(length:--text-8xl) leading-none font-semibold tracking-[-0.035em] text-center"
                    >
                        <Trans>Sealed.</Trans>
                    </Text>

                    <Text
                        maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                        className="text-secondary-foreground text-[15px] font-medium text-center"
                    >
                        {sealedDate} · {sealedTime}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

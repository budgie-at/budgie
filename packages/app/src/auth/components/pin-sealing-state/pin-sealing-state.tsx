import { UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useEffectEvent } from 'react';
import { AccessibilityInfo, ActivityIndicator, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { useProcessingHaptic } from '../../../@generic/hook/use-processing-haptic.hook';
import { PIN_STEP_FADE_DURATION_MS } from '../../constant/pin-motion.constant';
import { PinSetupModeEnum } from '../../enum/pin-setup-mode.enum';
import { PinFormSelector } from '../pin-form/pin-form.selector';

const SEALING_COPY = {
    [PinSetupModeEnum.CREATE]: {
        title: msg`Encrypting your data`,
        description: msg`Keep Budgie open. It restarts when finished.`,
        icon: UserIconNameEnum.LockKeyhole,
        iconVariant: 'positive' as const
    },
    [PinSetupModeEnum.CHANGE]: {
        title: msg`Updating your PIN`,
        description: msg`Re-encrypting your data. Keep Budgie open, it restarts when finished.`,
        icon: UserIconNameEnum.LockKeyhole,
        iconVariant: 'positive' as const
    },
    [PinSetupModeEnum.DISABLE]: {
        title: msg`Turning off app lock`,
        description: msg`Decrypting your data. Keep Budgie open, it restarts when finished.`,
        icon: UserIconNameEnum.LockKeyholeOpen,
        iconVariant: 'secondary' as const
    }
};

interface Props {
    readonly mode: PinSetupModeEnum;
}

const BREATH_DURATION_MS = 1_100;
const BREATH_MIN_OPACITY = 0.55;

export const PinSealingState = ({ mode }: Props) => {
    const { t } = useLingui();
    const { title, description, icon, iconVariant } = SEALING_COPY[mode];
    const breath = useSharedValue(1);
    const isReducedMotion = useReducedMotion();

    useProcessingHaptic(true);

    const announceTitle = useEffectEvent(() => void AccessibilityInfo.announceForAccessibility(t(title)));

    useEffect(() => {
        announceTitle();
    }, []);

    useEffect(() => {
        if (isReducedMotion) {
            return;
        }

        breath.set(
            withRepeat(withTiming(BREATH_MIN_OPACITY, { duration: BREATH_DURATION_MS, easing: Easing.inOut(Easing.sin) }), -1, true)
        );
    }, [breath, isReducedMotion]);

    const iconStyle = useAnimatedStyle(() => ({ opacity: breath.get() }));

    return (
        <Animated.View
            entering={FadeIn.duration(PIN_STEP_FADE_DURATION_MS).easing(EASE_OUT)}
            className="absolute inset-0 bg-primary-reverse items-center justify-center px-5xl gap-y-5xl"
            testID={PinFormSelector.SealingState}
            accessibilityViewIsModal
        >
            <Animated.View style={iconStyle}>
                <CircleIcon icon={icon} variant={iconVariant} size={88} iconSize={44} radius={28} />
            </Animated.View>

            <View className="items-center gap-y-md">
                <Text className="text-3xl font-semibold tracking-tight text-primary text-center" accessibilityRole="header">
                    {t(title)}
                </Text>

                <Text className="text-sm text-secondary-foreground text-center max-w-[300px]">{t(description)}</Text>
            </View>

            <ActivityIndicator size="small" colorClassName="accent-secondary-foreground" />
        </Animated.View>
    );
};

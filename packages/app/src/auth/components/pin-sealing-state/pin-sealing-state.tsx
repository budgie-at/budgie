import { UserIconNameEnum } from '@budgie/contracts';
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
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { PIN_SEALING_FADE_DURATION_MS } from '../../constant/pin-motion.constant';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly icon: UserIconNameEnum;
    readonly iconVariant: ColorPaletteVariant;
}

const BREATH_DURATION_MS = 1_100;
const BREATH_MIN_OPACITY = 0.55;

export const PinSealingState = ({ title, description, icon, iconVariant }: Props) => {
    const breath = useSharedValue(1);
    const isReducedMotion = useReducedMotion();

    const announceTitle = useEffectEvent(() => void AccessibilityInfo.announceForAccessibility(title));

    useEffect(() => {
        announceTitle();
    }, []);

    useEffect(() => {
        if (isReducedMotion) {
            return;
        }

        breath.set(
            withRepeat(withTiming(BREATH_MIN_OPACITY, { duration: BREATH_DURATION_MS, easing: Easing.inOut(Easing.ease) }), -1, true)
        );
    }, [breath, isReducedMotion]);

    const iconStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

    return (
        <Animated.View
            entering={FadeIn.duration(PIN_SEALING_FADE_DURATION_MS)}
            className="absolute inset-0 bg-primary-reverse items-center justify-center px-5xl gap-y-5xl"
            testID={PinFormSelector.SealingState}
            accessibilityViewIsModal
        >
            <Animated.View style={iconStyle}>
                <CircleIcon icon={icon} variant={iconVariant} size={88} iconSize={44} radius={28} />
            </Animated.View>

            <View className="items-center gap-y-md">
                <Text className="text-3xl font-semibold tracking-tight text-primary text-center" accessibilityRole="header">
                    {title}
                </Text>

                <Text className="text-sm text-secondary-foreground text-center max-w-[300px]">{description}</Text>
            </View>

            <ActivityIndicator size="small" colorClassName="accent-secondary-foreground" />
        </Animated.View>
    );
};

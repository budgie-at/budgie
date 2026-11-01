import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';

interface Props {
    readonly label: string;
    readonly isFlipped: boolean;
    readonly accessibilityLabel?: string;
    readonly onPress?: () => void;
}

const ANIMATION_DURATION = 200;
const ENTERING = FadeIn.duration(ANIMATION_DURATION);
const EXITING = FadeOut.duration(ANIMATION_DURATION);
const LAYOUT = LinearTransition.duration(ANIMATION_DURATION);
const ICON_SIZE = 12;
const HIT_SLOP = 10;
const ROTATION_DEGREES = 180;
const SPRING_CONFIG = { damping: 12, stiffness: 200 };

export const CurrencyModePill = ({ label, isFlipped, accessibilityLabel, onPress }: Props) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.set(withSpring(isFlipped ? ROTATION_DEGREES : 0, SPRING_CONFIG));
        // oxlint-disable-next-line react/exhaustive-deps -- rotation is a stable shared value reference
    }, [isFlipped]);

    const accessibilityRole = isDefined(onPress) ? 'button' : 'text';
    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    return (
        <Animated.View entering={ENTERING} exiting={EXITING} layout={LAYOUT}>
            <HapticPressable
                accessibilityLabel={accessibilityLabel ?? label}
                accessibilityRole={accessibilityRole}
                className="flex-row items-center gap-x-xs rounded-full bg-ghost-background px-md py-xxs"
                disabled={!isDefined(onPress)}
                hitSlop={HIT_SLOP}
                onPress={onPress}
            >
                {isDefined(onPress) ? (
                    <Animated.View style={iconStyle}>
                        <Icon icon={UserIconNameEnum.ArrowUpDown} className="text-secondary-foreground" size={ICON_SIZE} />
                    </Animated.View>
                ) : null}
                <Text
                    className="text-[13px] leading-[18px] font-semibold text-secondary-foreground"
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                >
                    {label}
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};

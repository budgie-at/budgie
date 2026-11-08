import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { EASE_IN_OUT, MOTION_FADE_IN, MOTION_FADE_OUT } from '../../../@generic/constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';

interface Props {
    readonly label: string;
    readonly isFlipped: boolean;
    readonly accessibilityLabel?: string;
    readonly onPress?: () => void;
}

const ICON_SIZE = 12;
const HIT_SLOP = 10;
const ROTATION_DEGREES = 180;
const ROTATION_DURATION = 240;

export const CurrencyModePill = ({ label, isFlipped, accessibilityLabel, onPress }: Props) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.set(withTiming(isFlipped ? ROTATION_DEGREES : 0, { duration: ROTATION_DURATION, easing: EASE_IN_OUT }));
        // oxlint-disable-next-line react/exhaustive-deps -- rotation is a stable shared value reference
    }, [isFlipped]);

    const accessibilityRole = isDefined(onPress) ? 'button' : 'text';
    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.get()}deg` }]
    }));

    return (
        <Animated.View entering={MOTION_FADE_IN} exiting={MOTION_FADE_OUT} className="min-w-0 shrink">
            <HapticPressable
                accessibilityLabel={accessibilityLabel ?? label}
                accessibilityRole={accessibilityRole}
                className="min-h-[44px] max-w-full justify-center"
                disabled={!isDefined(onPress)}
                hitSlop={HIT_SLOP}
                onPress={onPress}
                pressFeedback={HapticPressFeedbackEnum.SELECTION}
            >
                <View className="min-h-[32px] max-w-full flex-row items-center gap-x-xs rounded-full border-hairline border-surface-separator bg-transaction-detail-row px-md py-[4px] dark:border-transparent">
                    {isDefined(onPress) ? (
                        <Animated.View style={iconStyle}>
                            <Icon icon={UserIconNameEnum.ArrowUpDown} className="text-secondary-foreground" size={ICON_SIZE} />
                        </Animated.View>
                    ) : null}
                    <Text
                        className="shrink text-[13px] leading-[18px] font-semibold text-secondary-foreground"
                        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {label}
                    </Text>
                </View>
            </HapticPressable>
        </Animated.View>
    );
};

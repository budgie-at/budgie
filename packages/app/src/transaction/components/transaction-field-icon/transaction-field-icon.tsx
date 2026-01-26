import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { forwardRef, useImperativeHandle } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

const PRESSED_SCALE = 0.95;

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value?: string;
    readonly variant: ColorPaletteVariant;
    readonly onPress: () => void;
    readonly animationDelay?: number;
}

export interface TransactionFieldIconRef {
    shake: () => void;
}

export const TransactionFieldIcon = forwardRef<TransactionFieldIconRef, Props>((props, ref) => {
    const { icon, label, value, variant, onPress, animationDelay = 0 } = props;

    const pressed = useSharedValue(false);
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const pressedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(pressed.value ? PRESSED_SCALE : 1, { damping: 15, stiffness: 300 }) }]
    }));

    const handlePressIn = () => {
        pressed.value = true;
    };

    const handlePressOut = () => {
        pressed.value = false;
    };

    const hasValue = isNotEmptyString(value);
    const circleIconVariant = hasValue ? variant : 'ghost';
    const accessibilityLabel = `${label}: ${value ?? t`not set`}`;

    return (
        <Animated.View entering={FadeInUp.delay(animationDelay).duration(200)} className="flex-1 items-center">
            <Animated.View style={shakeStyle}>
                <Animated.View style={pressedStyle}>
                    <HapticPressable
                        className="items-center gap-sm"
                        onPress={onPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        accessibilityLabel={accessibilityLabel}
                        accessibilityRole="button"
                    >
                        <CircleIcon icon={icon} variant={circleIconVariant} size={48} iconSize={22} radius={16} />
                        <View className="items-center gap-y-0.5">
                            <Text className="text-xs text-secondary-foreground uppercase" numberOfLines={1}>
                                {label}
                            </Text>
                            {hasValue ? (
                                <Text className="text-xs text-primary font-medium max-w-[72px]" numberOfLines={1}>
                                    {value}
                                </Text>
                            ) : null}
                        </View>
                    </HapticPressable>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
});

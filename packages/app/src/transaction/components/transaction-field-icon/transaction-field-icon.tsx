import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { RefObject, useImperativeHandle } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

const PRESSED_SCALE = 0.95;

export interface TransactionFieldIconRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionFieldIconRef | null>;
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value?: string;
    readonly variant: ColorPaletteVariant;
    readonly onPress: () => void;
    readonly animationDelay?: number;
}

export const TransactionFieldIcon = (props: Props) => {
    const { ref, icon, label, value, variant, onPress, animationDelay = 0 } = props;

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
                        <CircleIcon icon={icon} variant={circleIconVariant} size={52} iconSize={24} radius={18} />
                        <View className="items-center gap-y-0.5 h-[32px]">
                            <Text className="text-xs text-secondary-foreground uppercase" numberOfLines={1}>
                                {label}
                            </Text>
                            <Text className="text-xs text-primary font-medium max-w-[80px] min-h-[14px]" numberOfLines={1}>
                                {hasValue ? value : ''}
                            </Text>
                        </View>
                    </HapticPressable>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
};

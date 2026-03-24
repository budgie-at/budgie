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
import { PRESSED_SCALE } from '../../constant/pressed-scale.constant';

export interface TransactionFieldIconRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionFieldIconRef | null>;
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value?: string;
    readonly variant: ColorPaletteVariant;
    readonly disabled?: boolean;
    readonly onPress: () => void;
    readonly animationDelay?: number;
    readonly testID?: string;
}

const disabledOpacity = { opacity: 0.3 };

export const TransactionFieldIcon = (props: Props) => {
    const { ref, icon, label, value, variant, disabled = false, onPress, animationDelay = 0, testID } = props;

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

    const pointerEvents = disabled ? 'none' : 'auto';
    const rootStyle = disabled ? disabledOpacity : void 0;

    return (
        <Animated.View
            entering={FadeInUp.delay(animationDelay).duration(200)}
            className="flex-1 items-center"
            style={rootStyle}
            pointerEvents={pointerEvents}
        >
            <Animated.View style={shakeStyle}>
                <Animated.View style={pressedStyle}>
                    <HapticPressable
                        className="items-center gap-sm"
                        onPress={onPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        accessibilityLabel={accessibilityLabel}
                        accessibilityRole="button"
                        testID={testID}
                    >
                        <CircleIcon icon={icon} variant={circleIconVariant} size={44} iconSize={20} radius={14} />
                        <View className="items-center gap-y-0.5 h-[28px]">
                            <Text className="text-xs text-secondary-foreground uppercase" numberOfLines={1}>
                                {label}
                            </Text>
                            <Text className="text-xs text-primary font-medium max-w-[68px] min-h-[14px]" numberOfLines={1}>
                                {hasValue ? value : ''}
                            </Text>
                        </View>
                    </HapticPressable>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
};

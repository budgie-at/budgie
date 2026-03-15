import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { ClassValue } from 'clsx';

type KeypadButtonVariant = 'digit' | 'action' | 'confirm' | 'cancel';

interface Props {
    readonly value?: string;
    readonly icon?: UserIconNameEnum;
    readonly variant?: KeypadButtonVariant;
    readonly colorVariant?: ColorPaletteVariant;
    readonly onPress: () => void;
    readonly onLongPress?: () => void;
    readonly disabled?: boolean;
    readonly spanning?: 1 | 2;
    readonly testID?: string;
}

const ICON_SIZE = 24;

const PRESS_ANIMATION_CONFIG = {
    scale: { pressed: 0.92, default: 1, damping: 15, stiffness: 300 },
    opacity: { pressed: 0.8, default: 1, duration: 50 }
} as const;

const buttonVariants = cva<{
    buttonVariant: Record<KeypadButtonVariant, ClassValue>;
}>('items-center justify-center rounded-xl', {
    variants: {
        buttonVariant: {
            digit: 'flex-1 bg-ghost-background',
            action: 'flex-1 bg-transparent',
            confirm: 'flex-[2] h-14',
            cancel: 'flex-1 h-14 bg-ghost-background'
        }
    },
    defaultVariants: { buttonVariant: 'digit' }
});

const confirmVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('border-0', {
    variants: { variant: BACKGROUND_COLOR_PALETTE }
});

const textVariants = cva<{
    buttonVariant: Record<KeypadButtonVariant, ClassValue>;
}>('text-2xl font-semibold', {
    variants: {
        buttonVariant: {
            digit: 'text-primary',
            action: 'text-secondary-foreground',
            confirm: '',
            cancel: 'text-secondary-foreground'
        }
    },
    defaultVariants: { buttonVariant: 'digit' }
});

const confirmTextVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const TransactionKeypadButton = (props: Props) => {
    const {
        value,
        icon,
        variant = 'digit',
        colorVariant = 'positive',
        onPress,
        onLongPress,
        disabled = false,
        spanning = 1,
        testID
    } = props;

    const pressed = useSharedValue(false);

    const handlePressIn = () => {
        pressed.value = true;
    };

    const handlePressOut = () => {
        pressed.value = false;
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: withSpring(pressed.value ? PRESS_ANIMATION_CONFIG.scale.pressed : PRESS_ANIMATION_CONFIG.scale.default, {
                    damping: PRESS_ANIMATION_CONFIG.scale.damping,
                    stiffness: PRESS_ANIMATION_CONFIG.scale.stiffness
                })
            }
        ],
        opacity: withTiming(pressed.value ? PRESS_ANIMATION_CONFIG.opacity.pressed : PRESS_ANIMATION_CONFIG.opacity.default, {
            duration: PRESS_ANIMATION_CONFIG.opacity.duration
        })
    }));

    const spanningClassName = spanning === 2 ? 'col-span-2' : '';
    const isConfirm = variant === 'confirm';

    const containerClassName = cn(
        buttonVariants({ buttonVariant: variant }),
        isConfirm && confirmVariants({ variant: colorVariant }),
        spanningClassName
    );

    const contentClassName = cn(textVariants({ buttonVariant: variant }), isConfirm && confirmTextVariants({ variant: colorVariant }));

    return (
        <HapticPressable
            accessibilityLabel={value ?? icon}
            accessibilityRole="button"
            className={containerClassName}
            disabled={disabled}
            onLongPress={onLongPress}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            testID={testID}
        >
            <Animated.View className="items-center justify-center" style={animatedStyle}>
                {isDefined(icon) ? (
                    <Icon className={contentClassName} icon={icon} size={ICON_SIZE} />
                ) : (
                    <Text className={contentClassName}>{value}</Text>
                )}
            </Animated.View>
        </HapticPressable>
    );
};

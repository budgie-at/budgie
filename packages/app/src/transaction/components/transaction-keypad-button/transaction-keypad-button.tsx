import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { type ClassValue } from 'cn';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

type KeypadButtonVariant = 'digit' | 'action' | 'confirm' | 'cancel';

interface Props {
    readonly value?: string;
    readonly icon?: UserIconNameEnum;
    readonly variant?: KeypadButtonVariant;
    readonly colorVariant?: ColorPaletteVariant;
    readonly onPress: () => void;
    readonly onLongPress?: () => void;
    readonly disabled?: boolean;
    readonly testID?: string;
}

const ICON_SIZE = 24;
const PRESSED_SCALE = 0.92;
const PRESSED_OPACITY = 0.8;
const SPRING_DAMPING = 15;
const SPRING_STIFFNESS = 300;
const OPACITY_DURATION_MS = 50;

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
    const { value, icon, variant = 'digit', colorVariant = 'positive', onPress, onLongPress, disabled = false, testID } = props;

    const pressed = useSharedValue(false);

    const handlePressIn = () => {
        pressed.set(true);
    };

    const handlePressOut = () => {
        pressed.set(false);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: withSpring(pressed.value ? PRESSED_SCALE : 1, { damping: SPRING_DAMPING, stiffness: SPRING_STIFFNESS })
            }
        ],
        opacity: withTiming(pressed.value ? PRESSED_OPACITY : 1, { duration: OPACITY_DURATION_MS })
    }));

    const isConfirm = variant === 'confirm';

    const containerClassName = cn(buttonVariants({ buttonVariant: variant }), isConfirm && confirmVariants({ variant: colorVariant }));

    const contentClassName = cn(textVariants({ buttonVariant: variant }), isConfirm && confirmTextVariants({ variant: colorVariant }));
    const hasTestID = isDefined(testID);

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
            {...(!isConfirm && hasTestID && { testID })}
        >
            <Animated.View
                className="items-center justify-center"
                collapsable={false}
                style={animatedStyle}
                {...(isConfirm && hasTestID && { testID })}
            >
                {isDefined(icon) ? (
                    <Icon className={contentClassName} icon={icon} size={ICON_SIZE} />
                ) : (
                    <Text className={contentClassName}>{value}</Text>
                )}
            </Animated.View>
        </HapticPressable>
    );
};

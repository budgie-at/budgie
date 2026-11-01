import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { type ClassValue } from 'cn';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

type KeypadButtonVariant = 'digit' | 'action' | 'cancel';

interface Props {
    readonly value?: string;
    readonly icon?: UserIconNameEnum;
    readonly variant?: KeypadButtonVariant;
    readonly accessibilityLabel?: string;
    readonly onPress: () => void;
    readonly onLongPress?: () => void;
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
            digit: 'flex-1 bg-transaction-detail-row',
            action: 'flex-1 bg-transparent',
            cancel: 'flex-1 h-[56px] bg-transaction-detail-row'
        }
    },
    defaultVariants: { buttonVariant: 'digit' }
});

const textVariants = cva<{
    buttonVariant: Record<KeypadButtonVariant, ClassValue>;
}>('text-2xl font-semibold tabular-nums', {
    variants: {
        buttonVariant: {
            digit: 'text-primary',
            action: 'text-secondary-foreground',
            cancel: 'text-secondary-foreground'
        }
    },
    defaultVariants: { buttonVariant: 'digit' }
});

export const TransactionKeypadButton = (props: Props) => {
    const { value, icon, variant = 'digit', accessibilityLabel, onPress, onLongPress, testID } = props;

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

    const contentClassName = textVariants({ buttonVariant: variant });

    return (
        <HapticPressable
            accessibilityLabel={accessibilityLabel ?? value ?? icon}
            accessibilityRole="button"
            className={buttonVariants({ buttonVariant: variant })}
            onLongPress={onLongPress}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            testID={testID}
        >
            <Animated.View className="items-center justify-center" collapsable={false} style={animatedStyle}>
                {isDefined(icon) ? (
                    <Icon className={contentClassName} icon={icon} size={ICON_SIZE} />
                ) : (
                    <Text className={contentClassName}>{value}</Text>
                )}
            </Animated.View>
        </HapticPressable>
    );
};

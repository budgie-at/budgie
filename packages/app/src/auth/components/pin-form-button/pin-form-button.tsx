import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { AccessibilityActionEvent, Pressable, Text } from 'react-native';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { useIsCompactPinLayout } from '../../hook/use-is-compact-pin-layout.hook';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly digit: string;
    readonly disabled?: boolean;
    readonly onPress: (digit: string) => void;
}

const keyVariants = cva(
    'rounded-full justify-center items-center bg-secondary-foreground/25 active:bg-secondary-foreground/55 active:scale-s',
    {
        variants: {
            isCompact: {
                true: 'size-[64px]',
                false: 'size-[76px]'
            }
        }
    }
);

const ACCESSIBILITY_ACTIONS = [{ name: 'activate' }] as const;

const digitVariants = cva('font-light text-primary', {
    variants: {
        isCompact: {
            true: 'text-3xl',
            false: 'text-4.5xl'
        }
    }
});

export const PinFormButton = ({ digit, onPress, disabled = false }: Props) => {
    const isCompact = useIsCompactPinLayout();
    const [, hapticImpact] = useVibration();
    const accessibilityState = { disabled };

    const handlePressIn = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onPress(digit);
    };

    const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
        if (!disabled && event.nativeEvent.actionName === 'activate') {
            handlePressIn();
        }
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={handleAccessibilityAction}
            disabled={disabled}
            accessibilityRole="keyboardkey"
            accessibilityLabel={digit}
            accessibilityState={accessibilityState}
            testID={PinFormSelector.Digit(digit)}
            className={keyVariants({ isCompact })}
        >
            <Text className={digitVariants({ isCompact })}>{digit}</Text>
        </Pressable>
    );
};

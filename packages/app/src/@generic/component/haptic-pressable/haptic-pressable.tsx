import { cn } from 'cn';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { ComponentProps, useRef } from 'react';
import { GestureResponderEvent, Keyboard, Pressable } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useVibration } from '../../hook/use-vibration.hook';

export const HapticPressable = ({ onLongPress, onPress, onPressOut, disabled, className, ...rest }: ComponentProps<typeof Pressable>) => {
    const [, hapticImpact] = useVibration();
    const isLongPressActiveRef = useRef(false);

    const handlePress = (event: GestureResponderEvent) => {
        if (disabled) {
            return;
        }

        if (isLongPressActiveRef.current) {
            isLongPressActiveRef.current = false;

            return;
        }

        hapticImpact(ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        onPress?.(event);
    };

    const handleLongPress = (event: GestureResponderEvent) => {
        if (disabled) {
            return;
        }

        isLongPressActiveRef.current = true;
        onLongPress?.(event);
    };

    const handlePressOut = (event: GestureResponderEvent) => {
        onPressOut?.(event);

        if (isLongPressActiveRef.current) {
            isLongPressActiveRef.current = false;
        }
    };

    return (
        <Pressable
            className={cn('active:scale-xs', className)}
            hitSlop={10}
            {...(isDefined(onLongPress) && { onLongPress: handleLongPress })}
            onPress={handlePress}
            onPressOut={handlePressOut}
            disabled={disabled}
            {...rest}
        />
    );
};

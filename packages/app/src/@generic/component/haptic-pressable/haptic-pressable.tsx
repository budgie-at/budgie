import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { ComponentProps } from 'react';
import { GestureResponderEvent, Keyboard, Pressable } from 'react-native';

import { useVibration } from '../../hook/use-vibration.hook';
import { cn } from '../../utils/cn.util';

export const HapticPressable = ({ onPress, disabled, className, ...rest }: ComponentProps<typeof Pressable>) => {
    const [, hapticImpact] = useVibration();

    const handlePress = (event: GestureResponderEvent) => {
        if (disabled) {
            return;
        }

        hapticImpact(ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        onPress?.(event);
    };

    return <Pressable className={cn('active:scale-xs', className)} hitSlop={10} onPress={handlePress} disabled={disabled} {...rest} />;
};

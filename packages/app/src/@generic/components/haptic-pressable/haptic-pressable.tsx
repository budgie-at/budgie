import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { ComponentProps } from 'react';
import { GestureResponderEvent, Keyboard, Pressable } from 'react-native';

import { useVibration } from '../../hooks/use-vibration.hook';
import { cn } from '../../utils/cn.util';

export const HapticPressable = ({ onPress, className, ...rest }: ComponentProps<typeof Pressable>) => {
    const [, hapticImpact] = useVibration();

    const handlePress = (event: GestureResponderEvent) => {
        hapticImpact(ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        onPress?.(event);
    };

    return <Pressable className={cn('active:scale-xs', className)} onPress={handlePress} {...rest} />;
};

import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { useVibration } from '../../hook/use-vibration.hook';
import { Icon } from '../icon/icon';

import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import type { GestureResponderEvent } from 'react-native';

interface TabButtonProps extends TabTriggerSlotProps {
    readonly icon: LucideIcon;
}

const tabVariants = cva('rounded-5xl p-xl', {
    variants: {
        isFocused: {
            true: 'bg-ghost-background',
            false: ''
        }
    }
});

const tabIconVariants = cva('', {
    variants: {
        isFocused: {
            true: 'stroke-[2.5] text-primary',
            false: 'stroke-2 text-primary/40'
        }
    }
});

export const TabButton = ({ children, isFocused = false, onPress, icon, style: _, ...rest }: TabButtonProps) => {
    const [, hapticImpact] = useVibration();

    const handlePress = (event: GestureResponderEvent) => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onPress?.(event);
    };

    return (
        <Pressable {...rest} onPress={handlePress}>
            <View className={tabVariants({ isFocused })}>
                <Icon className={tabIconVariants({ isFocused })} icon={icon} size={24} />
            </View>
        </Pressable>
    );
};
